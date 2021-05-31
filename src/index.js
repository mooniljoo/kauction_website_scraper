const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const Store = require("electron-store");
const jsonToXlsx = require("./utils/sheetJs");

Store.initRenderer();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    minWidth: 1340,
    minHeight: 300,
    width: 1560,
    height: 720,
    // frame: false,
    icon: path.join(__dirname, "src/icons/app.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    resizable: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "/views/app/app.html"));
  mainWindow.setMenuBarVisibility(false);
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("create_xlsx", (event, res, dirName) => {
  // console.log(res);
  try {
    if (!res) {
      return false;
    } else {
      let source = res[0].source;
      let transactDate = res[0].transactDate
        .replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, "")
        .split(" ");
      let year = transactDate[0].substr(2);
      let mon =
        transactDate[1].length == 1 ? "0" + transactDate[1] : transactDate[1];
      let day = transactDate[2];
      let date = year + mon + day;
      // let auctionTitle = res[0].auctionTitle.replace(/[\s]/g, "");
      let auctionTitle = res[0].auctionTitle.split(" ")[0];
      let fileName = source + "_" + date + "_" + auctionTitle;
      console.log("fileName", fileName);
      fileName = jsonToXlsx.write(
        dirName, //dirName
        fileName, //fileName
        date + "_" + auctionTitle, //sheetName
        res
      );
      console.log("XLSX has created.");
      dialog.showMessageBox(null, {
        message: "성공",
        detail: fileName + "생성에 성공했습니다",
      });
      event.returnValue = fileName;
    }
  } catch (e) {
    console.error(e);
    dialog.showErrorBox(
      "문제가 발생했습니다🤦‍♂️\n프로그램을 다시시작해주세요😥\n" + e
    );
    event.returnValue = e;
  }
});

ipcMain.on("display_error", (event, msg) => {
  console.error(msg);
  dialog.showErrorBox("알 수 없는 문제가 발생했습니다.\n" + msg);
  event.returnValue = "error displayed";
});
