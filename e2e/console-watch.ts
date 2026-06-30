import type { Page, ConsoleMessage } from "@playwright/test";

export type ConsoleWatcher = {
  /** 수집된 콘솔 error/warning 메시지 텍스트. */
  readonly messages: string[];
  /** 수집된 페이지 런타임 예외(pageerror) 텍스트. */
  readonly pageErrors: string[];
};

/**
 * 페이지의 콘솔 error/warning 및 런타임 예외(pageerror)를 수집하는 감시자.
 *
 * hydration mismatch 는 React 가 console.error 로 출력하므로 이 감시로 잡힌다.
 * page.goto 전에 부착해야 초기 렌더 단계의 에러를 놓치지 않는다.
 */
export function watchConsole(page: Page): ConsoleWatcher {
  const messages: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      messages.push(`[${type}] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err: Error) => {
    pageErrors.push(`[pageerror] ${err.message}`);
  });

  return {
    get messages() {
      return messages;
    },
    get pageErrors() {
      return pageErrors;
    },
  };
}
