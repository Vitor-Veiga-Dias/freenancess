export type Dictionary = {
  common: {
    personal: string;
    business: string;
    signOut: string;
    signIn: string;
    getStarted: string;
    loading: string;
    connect: string;
    connecting: string;
    search: string;
    cancel: string;
    available: string;
    limit: string;
    expiringSoon: string;
    noResults: string;
    delete: string;
    save: string;
    expense: string;
    income: string;
  };
  language: {
    label: string;
    en: string;
    pt: string;
  };
  nav: {
    overview: string;
    overviewDescription: string;
    entries: string;
    entriesDescription: string;
    viewingContext: string;
  };
  marketing: {
    tagline: string;
    headline: string;
    headlineAccent: string;
    description: string;
    startFree: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    email: string;
    password: string;
    name: string;
    signingIn: string;
    creating: string;
    noAccount: string;
    register: string;
    hasAccount: string;
    signInFailed: string;
    registerFailed: string;
  };
  overview: {
    title: string;
    subtitle: string;
    totalExpenses: string;
    totalIncome: string;
    balance: string;
    expensesByCategory: string;
    incomeByCategory: string;
    emptyExpenses: string;
    emptyIncome: string;
    emptyAll: string;
    addEntry: string;
  };
  entries: {
    title: string;
    subtitle: string;
    type: string;
    amount: string;
    description: string;
    category: string;
    date: string;
    submit: string;
    save: string;
    submitting: string;
    empty: string;
    edit: string;
    editing: string;
    amountHint: string;
    invalidAmount: string;
    deleteFailed: string;
    createFailed: string;
    updateFailed: string;
    categories: {
      housing: string;
      food: string;
      transport: string;
      health: string;
      leisure: string;
      subscriptions: string;
      shopping: string;
      other_expense: string;
      salary: string;
      freelance: string;
      investment_income: string;
      other_income: string;
    };
  };
  feed: {
    moneyFlow: string;
    narrativeFeed: string;
    placeholderTitle: string;
    placeholderNarrative: string;
    placeholderAction: string;
  };
  flows: {
    title: string;
    subtitle: string;
  };
  connections: {
    title: string;
    subtitle: string;
    connectBank: string;
    chooseBank: string;
    chooseBankHint: string;
    selectContext: string;
    empty: string;
    consentExpires: string;
    lastSynced: string;
    connected: string;
    connectFailed: string;
    stubMessage: string;
    pluggyMessage: string;
    scopes: string;
  };
  sandbox: {
    title: string;
    subtitle: string;
    exampleQuestion: string;
    exampleAnswer: string;
  };
  flowLabels: {
    OBLIGATIONS: string;
    RESERVES: string;
    DISCRETIONARY: string;
    INVESTMENT: string;
  };
  status: {
    CONNECTED: string;
    PENDING: string;
    ERROR: string;
    REVOKED: string;
  };
};
