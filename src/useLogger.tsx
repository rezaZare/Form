export function useLogger(componentName: string) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const info = (...message: any[]) => {
    if (shouldLog()) {
      console.log(`${componentName} (${getTimeStamp()}):`, ...message);
    }
  };

  function shouldLog() {
    const debugMode = localStorage.getItem("debug") || "";
    const should =
      debugMode === "*" ||
      debugMode.toLowerCase() === componentName.toLowerCase();
    return should;
  }

  function getTimeStamp() {
    return new Date().toISOString();
  }

  const log = {
    info,
  };

  return log;
}
