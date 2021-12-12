/**
 * notion-enhancer: tray
 * (c) 2021 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

'use strict';

module.exports = async function ({ env }, db, __exports, __eval) {
  const electron = require('electron'),
    urlHelpers = env.notionRequire('helpers/urlHelpers'),
    runInBackground = await db.get(['run_in_background']);
  if (!runInBackground) return;

  let appQuit = false;
  electron.app.once('before-quit', () => {
    appQuit = true;
  });

  const notionCreateWindow = __exports.createWindow;
  __exports.createWindow = (relativeUrl = '', args) => {
    const windows = electron.BrowserWindow.getAllWindows();
    if (windows.length) windows.forEach((win) => win.show());

    if (relativeUrl || !windows.length) {
      // hijack close event to hide instead
      const window = notionCreateWindow(relativeUrl, args);
      window.prependListener('close', (e) => {
        const isLastWindow = electron.BrowserWindow.getAllWindows().length === 1;
        if (!appQuit && isLastWindow) {
          window.hide();
          e.preventDefault();
          throw new Error('<fake error>: prevent window close');
        }
      });

      // no other windows yet + opened at startup = hide
      const wasOpenedAtStartup =
        process.argv.includes('--startup') ||
        app.getLoginItemSettings({ args: ['--startup'] }).wasOpenedAtLogin;
      if (!windows.length && wasOpenedAtStartup) {
        window.once('ready-to-show', () => window.hide());
      }

      return window;
    } else {
      // prevents duplicate windows on dock/taskbar click
      windows[0].focus();
      if (relativeUrl) {
        // handle requests passed via the notion:// protocol
        // or ctrl+click
        windows[0].loadURL(urlHelpers.getIndexUrl(relativeUrl));
      }
      return windows[0];
    }
  };
};
