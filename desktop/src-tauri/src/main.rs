#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};

const DESKTOP_PORT: &str = "3847";
const APP_URL: &str = "http://127.0.0.1:3847";

struct ServerState(Arc<Mutex<Option<Child>>>);

fn find_project_root() -> Result<PathBuf, String> {
    let mut dir = std::env::current_dir().map_err(|error| error.to_string())?;

    loop {
        if dir.join("package.json").exists() && dir.join("prisma").exists() {
            return Ok(dir);
        }

        if !dir.pop() {
            break;
        }
    }

    Err("Could not find Freenances project root".into())
}

fn resolve_runtime_root(app: &AppHandle) -> Result<PathBuf, String> {
    if cfg!(debug_assertions) {
        return Ok(find_project_root()?.join("desktop").join("runtime"));
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?;

    Ok(resource_dir.join("runtime"))
}

fn load_env_file(path: &Path, env: &mut HashMap<String, String>) {
    let Ok(content) = fs::read_to_string(path) else {
        return;
    };

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let Some((key, raw_value)) = trimmed.split_once('=') else {
            continue;
        };

        let mut value = raw_value.trim().to_string();
        if value.starts_with('"') && value.ends_with('"') && value.len() >= 2 {
            value = value[1..value.len() - 1].to_string();
        }

        env.entry(key.trim().to_string()).or_insert(value);
    }
}

fn collect_env(runtime_root: &Path) -> HashMap<String, String> {
    let mut env = HashMap::new();

    if cfg!(debug_assertions) {
        if let Ok(root) = find_project_root() {
            load_env_file(&root.join(".env"), &mut env);
            load_env_file(&root.join(".env.desktop"), &mut env);
        }
    }

    load_env_file(&runtime_root.join(".env"), &mut env);

    env.insert(
        "FREENANCES_RUNTIME".to_string(),
        "desktop".to_string(),
    );
    env.insert("NODE_ENV".to_string(), "production".to_string());
    env.insert("PORT".to_string(), DESKTOP_PORT.to_string());
    env.insert("HOSTNAME".to_string(), "127.0.0.1".to_string());
    env.insert("NEXT_PUBLIC_APP_URL".to_string(), APP_URL.to_string());
    env.insert("BETTER_AUTH_URL".to_string(), APP_URL.to_string());

    env
}

fn resolve_node_executable() -> Result<String, String> {
    if let Ok(node) = which::which("node") {
        return Ok(node.to_string_lossy().into_owned());
    }

    if cfg!(target_os = "windows") {
        for candidate in [
            r"C:\Program Files\nodejs\node.exe",
            r"C:\Program Files (x86)\nodejs\node.exe",
        ] {
            if Path::new(candidate).exists() {
                return Ok(candidate.to_string());
            }
        }
    }

    Err("Node.js was not found. Install Node.js 22+ and try again.".into())
}

fn wait_for_health() -> Result<(), String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|error| error.to_string())?;

    for _ in 0..120 {
        if let Ok(response) = client.get(format!("{APP_URL}/api/health")).send() {
            if response.status().is_success() {
                return Ok(());
            }
        }

        thread::sleep(Duration::from_millis(500));
    }

    Err(format!("Desktop server did not start at {APP_URL}"))
}

fn start_next_server(app: &AppHandle) -> Result<Child, String> {
    let runtime_root = resolve_runtime_root(app)?;
    let app_dir = runtime_root.join("app");
    let server_js = app_dir.join("server.js");

    if !server_js.exists() {
        return Err(
            "Desktop runtime is missing. Run `npm run desktop:bundle` before building the executable."
                .into(),
        );
    }

    let node = resolve_node_executable()?;
    let env_map = collect_env(&runtime_root);

    let mut command = Command::new(node);
    command
        .arg("server.js")
        .current_dir(&app_dir)
        .stdout(Stdio::null())
        .stderr(Stdio::piped());

    command.env_clear();
    for (key, value) in env_map {
        command.env(key, value);
    }

    let mut child = command
        .spawn()
        .map_err(|error| format!("Failed to start desktop server: {error}"))?;

    if let Some(stderr) = child.stderr.take() {
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().map_while(Result::ok) {
                eprintln!("[desktop-server] {line}");
            }
        });
    }

    wait_for_health()?;
    Ok(child)
}

fn stop_next_server(state: &ServerState) {
    if let Ok(mut guard) = state.0.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

fn main() {
    let server_state = ServerState(Arc::new(Mutex::new(None)));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(server_state.clone())
        .setup(move |app| {
            let child = start_next_server(app.handle())?;
            if let Ok(mut guard) = server_state.0.lock() {
                *guard = Some(child);
            }

            if app.get_webview_window("main").is_none() {
                WebviewWindowBuilder::new(app, "main", WebviewUrl::External(APP_URL.parse().unwrap()))
                    .title("Freenances")
                    .inner_size(1280.0, 840.0)
                    .min_inner_size(960.0, 640.0)
                    .build()
                    .map_err(|error| error.to_string())?;
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if matches!(event, RunEvent::Exit) {
                if let Some(state) = app_handle.try_state::<ServerState>() {
                    stop_next_server(state.inner());
                }
            }
        });
}
