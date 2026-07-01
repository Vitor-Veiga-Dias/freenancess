interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-1 border-b border-subtle pb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-secondary">{description}</p>}
    </header>
  );
}
