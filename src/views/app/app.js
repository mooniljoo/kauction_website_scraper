const { ipcRenderer } = require("electron");
const puppeteer = require("puppeteer");
const rootPath = require("electron-root-path").rootPath;
const shell = require("electron").shell;

let boolRunning = true;
let boolMax = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Scraper DOM fully loaded");
  document.getElementById("input_dirPath").value = rootPath;
});
function btn_close() {
  console.log("cl");
  ipcRenderer.send("close");
}
function btn_minimize() {
  boolMax = true;
  ipcRenderer.send("minimize");
}
function btn_maximize() {
  if (!boolMax) ipcRenderer.send("maximize");
  boolMax = true;
}
function toggleMaximize() {
  try {
    if (boolMax) {
      boolMax = false;
      ipcRenderer.send("unmaximize");
    } else {
      boolMax = true;
      ipcRenderer.send("maximize");
    }
  } catch (e) {
    console.error(e);
  }
}
function showNotification(title, msg) {
  ipcRenderer.send("showNotification", title, msg);
}
function openDialogMsg(msg) {
  ipcRenderer.send("openDialogMsg", msg);
}
function openDialogError(msg) {
  ipcRenderer.send("openDialogError", msg);
}
function setLoading() {
  setStateMsg("불러오는 중입니다...");
  document.querySelector(".state").classList.add("on");
  document.getElementById("btnRunning").classList.add("disabled");
  document.getElementById("btnSelectDirPath").classList.add("disabled");
  document.getElementById("btnOpenDir").classList.add("disabled");
  document.getElementById("btnCancel").classList.remove("disabled");
  document.getElementById("btnCancel").classList.remove("disabled");
  let = allCheckbox = document.querySelectorAll(
    "#wrapper_checkbox input[type=checkbox]"
  );
  for (let i = 0; i < allCheckbox.length; i++) {
    allCheckbox[i].setAttribute("disabled", "disabled");
  }
}
function unsetLoading() {
  document.querySelector(".state").classList.remove("on");
  document.getElementById("btnRunning").classList.remove("disabled");
  document.getElementById("btnSelectDirPath").classList.remove("disabled");
  document.getElementById("btnOpenDir").classList.remove("disabled");
  document.getElementById("btnCancel").classList.add("disabled");
  let = allCheckbox = document.querySelectorAll(
    "#wrapper_checkbox input[type=checkbox]"
  );
  for (let i = 0; i < allCheckbox.length; i++) {
    allCheckbox[i].removeAttribute("disabled");
  }
}

function openDir(el) {
  //check this element is disabled or not
  if (el.classList.contains("disabled")) return;
  let dirPath = document.getElementById("input_dirPath").value;
  console.log("open the folder", dirPath);
  shell.openExternal(dirPath);
}

function setStateMsg(msg) {
  console.log(msg);
  document.getElementById("stateMsg").innerText = msg;
}

function onCancel(el) {
  //check this element is disabled or not
  if (el.classList.contains("disabled")) return;
  // show msg to screen for user
  setStateMsg("취소중입니다...");
  boolRunning = false;
}

function openDialogFile(el) {
  //check this element is disabled or not
  if (el.classList.contains("disabled")) return;
  // send to Main Process
  let resp = ipcRenderer.sendSync("openDialogFile", rootPath);
  // recv to Main Process
  if (resp.filePaths[0] != undefined)
    document.getElementById("input_dirPath").value = resp.filePaths[0];
}

async function configureBrowser() {
  const browser = await puppeteer.launch({
    devtools: false,
    headless: true,
    defaultViewport: null,
    args: ["--window-size=1280,1080"],
  });
  return browser;
}
function getArrAuction() {
  allCheckbox = document.querySelectorAll(
    "#wrapper_checkbox input[type=checkbox]"
  );
  let arrAuction = [];

  for (let i = 0; i < allCheckbox.length; i++) {
    if (allCheckbox[i].checked) {
      arrAuction.push(allCheckbox[i].value);
    }
  }
  if (arrAuction.length == 0) {
    let msg = "적어도 경매를 하나는 선택해야 합니다.";
    console.log(msg);
    openDialogMsg(msg);
    return null;
  }
  return arrAuction;
}

async function scraper(url) {
  // set loading state
  setLoading();
  // init variables
  const auction_id = "sophihlee94";
  const auction_pw = "!Hj2hj2hj2";
  const arrAuction = getArrAuction();
  const arrClosedAuction = [];
  const arrOpenedAuction = [];
  const arrSuccessfulAuctionsSaved = [];
  const arrFailedAuctionsSaved = [];
  // check for auctions to scrape
  if (arrAuction == null) return false;
  setStateMsg(`"${arrAuction}" 경매를 선택하셨어요!👌`);

  // ready for browser
  const browser = await configureBrowser();
  const page = await browser.newPage();
  //access the website
  setStateMsg("사이트에 접근합니다...⏱");
  await page.goto(url, { waitUntil: "domcontentloaded" });

  setStateMsg("로그인을 시도합니다...⏱");
  // click elem login
  try {
    const elem_login = await page.waitForSelector(
      "div.header-util > a:nth-child(1)",
      { timeout: 9000 }
    );
    await elem_login.click();

    await page.waitForSelector("#modal-login-pwd", { timeout: 9000 });
    await page.evaluate(
      (id, pw) => {
        document.querySelector("#modal-login-id").value = id;
        document.querySelector("#modal-login-pwd").value = pw;
      },
      auction_id,
      auction_pw
    );

    const button_login = await page.waitForSelector(
      ".loginForm-wrap > button",
      {
        timeout: 9000,
      }
    );
    await page.waitForTimeout(500);
    console.log(button_login);
    await button_login.click();
    await page.waitForNavigation();
    setStateMsg("로그인에 성공했습니다...👍");
  } catch (e) {
    console.error(e);
    showNotification(
      "로그인 실패🤷‍♂️",
      "로그인이 필요하지 않은 정보들만 가져오겠습니다.😂"
    );
  }

  ///////////////// LOOPS /////////////////
  setStateMsg("브라우저가 준비되었습니다...⏱");
  //DEPTH 1 : auction
  let auctionIndex = 0;
  let auctionCount = arrAuction.length;
  while (boolRunning) {
    if (arrAuction[auctionIndex] == undefined) break;
    /////////// auction ////////////
    await page.waitForSelector(".top_nav", { timeout: 9000 });
    //access the nav
    await page.hover(".top_nav");
    await page.waitForTimeout(1000);
    // select the auction
    setStateMsg(`"${arrAuction[auctionIndex]} 경매의 상태를 확인합니다...⏱`);
    let selector_auction;
    if (arrAuction[auctionIndex] == "major") {
      selector_auction = ".top_nav .Major-on > a";
    } else if (arrAuction[auctionIndex] == "premium") {
      selector_auction = ".top_nav .Premium-on > a";
    } else if (arrAuction[auctionIndex] == "weekly") {
      selector_auction = ".top_nav .Weekly-on > a";
    } else {
      throw new Error(`Error: 웹사이트의 구조가 바뀌었습니다.`);
    }

    const button_auction = await page.$(selector_auction);
    console.log(button_auction);
    if (button_auction == null) {
      setStateMsg(
        `아직 ${arrAuction[auctionIndex]}경매가 열리지 않아 다음 경매로 넘어갑니다😊`
      );
      arrClosedAuction.push(arrAuction[auctionIndex]);
    } else {
      arrOpenedAuction.push(arrAuction[auctionIndex]);
      //init auctionResult
      let auctionResult = [];
      // acess the auction
      setStateMsg(`${arrAuction[auctionIndex]} 경매에 접근합니다...⏱`);
      await page.waitForTimeout(500);
      await button_auction.click();
      //DEPTH 2 : pagination
      let pageIndex = 2;
      let pageCount = 0;

      //get title
      let source = "";
      let transactDate = "";
      setStateMsg(`${arrAuction[auctionIndex]} 경매의 출품처를 확인합니다...⏱`);
      try {
        const elem_title = await page.waitForSelector(".subtop-desc", {
          timeout: 30000,
        });
        source = await elem_title.evaluate((html) => {
          return html.querySelector("h1")?.innerText;
        });
        transactDate = await elem_title.evaluate((html) => {
          return html
            .querySelector(".subtop-desc > p")
            ?.innerText.split(" ")
            .slice(0, 3)
            .join(" ");
        });
      } catch (e) {
        console.error(e);
        await page.screenshot({
          fullPage: true,
          path: `kauction-gettitle-${new Date()
            .toISOString()
            .substr(0, 10)}.jpeg`,
        });
        showNotification(
          `${arrAuction[auctionIndex]}경매 출품처 분석 실패🤷‍♂️`,
          "출품처와 경매일을 제외한 정보를 불러오겠습니다😂"
        );
      }

      while (boolRunning) {
        ///// ready for next page
        await page.waitForTimeout(500);
        let paginateButton;
        try {
          paginateButton = await page.$$(".paginate_button.page-item > a");
        } catch (e) {
          console.error(e);
          await page.screenshot({
            fullPage: true,
            path: `kauction-page-item-${new Date()
              .toISOString()
              .substr(0, 10)}.jpeg`,
          });
        }
        let bool_isNextButtonDisabled = await page.$eval(
          ".paginate_button.active",
          (el) => {
            return el.nextElementSibling.classList.contains("disabled");
          }
        );
        //check if paginate button is disabled
        if (bool_isNextButtonDisabled) break;
        paginateButton[pageIndex].click();
        if (pageIndex == paginateButton.length - 2) pageIndex = 2;

        //DEPTH 3 : artwork
        let artworkIndex = 0;
        let artworkCount = 0;
        while (boolRunning) {
          await page.waitForTimeout(500);
          let list;
          try {
            list = await page.$("#list");
          } catch (e) {
            await page.screenshot({
              fullPage: true,
              path: `kauction-list-artworkIndex${artworkIndex}-${new Date()
                .toISOString()
                .substr(0, 10)}.jpeg`,
            });
            throw new puppeteer.TimeoutError("#list", e);
          }
          if (list == null) {
            await page.screenshot({
              fullPage: true,
              path: `kauction-list-artworkIndex${artworkIndex}-${new Date()
                .toISOString()
                .substr(0, 10)}.jpeg`,
            });
            showNotification(`경매품목록`, "경매품 목록이 존재하지 않습니다.");
          }
          const arrArtwork = await list.$$(".artwork > a");
          artworkCount = arrArtwork.length;
          //check if artwork exists
          if (arrArtwork[artworkIndex] == undefined) break;

          let outerDesc;
          let winningBid = "";
          let winningBidUnit = "";
          //scraping winningBid
          try {
            winningBid = await page.evaluate(() => {
              return document.querySelector(".list-inline-item > span")
                .innerText;
            });

            // 낙찰가가 있으면
            if (String(winningBid).includes("낙찰가")) {
              setStateMsg(`낙찰가를 불러옵니다...⏱`);
              winningBidUnit = winningBid?.replace(/[^A-Z]/g, "").trim();
              winningBid = winningBid
                ?.replace(/[^0-9]/g, "")
                .trim()
                .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
              winningBid = winningBid == undefined ? "" : winningBid;
              winningBidUnit =
                winningBidUnit == undefined ? "" : winningBidUnit;
            } else {
              winningBid = "";
            }
          } catch (e) {
            console.error(e);
            await page.screenshot({
              fullPage: true,
              path: `kauction-list-winningBid-${new Date()
                .toISOString()
                .substr(0, 10)}.jpeg`,
            });
            showNotification(
              `${arrAuction[auctionIndex]}경매 낙찰가 분석 실패🤷‍♂️`,
              "낙찰가를 제외한 정보를 불러오겠습니다😂"
            );
          }

          outerDesc = { winningBid, winningBidUnit };

          //access to new artwork page
          setStateMsg(`상세페이지에 접근시도합니다...⏱`);
          arrArtwork[artworkIndex].click();

          // parsing inner description of artwork
          await page.waitForTimeout(1000);

          setStateMsg(`구조를 분석합니다...⏱`);
          let innerDesc;
          try {
            innerDesc = await parsing(page);
            setStateMsg(`정보를 성공적으로 불러왔습니다...⏱`);
          } catch (e) {
            console.error(e);
            await page.screenshot({
              fullPage: true,
              path: `kauction-detailPage-parsing${artworkIndex + 1}-${new Date()
                .toISOString()
                .substr(0, 10)}.jpeg`,
            });
            showNotification(
              `상세페이지 분석 실패🤷‍♂️`,
              `(${artworkIndex + 1}/${artworkCount}) ${innerDesc.number}|${
                innerDesc.artistKr || innerDesc.artistEn
              }|${
                innerDesc.titleKr || innerDesc.titleEn
              }의 정보를 제외하고 불러오겠습니다😂`
            );
          }
          description = { source, transactDate, ...outerDesc, ...innerDesc };
          auctionResult.push(description);
          // displaying description
          await drawTableforDesc([description]);
          // go again
          await page.goBack();
          artworkIndex++;
        }

        pageIndex++;
      }
      setStateMsg(`${arrAuction[auctionIndex]}경매 파싱을 마쳤습니다😊`);
      setStateMsg(
        `${auctionResult.length}개의 작품을 ${arrAuction[auctionIndex]}경매에서 불러왔습니다😊`
      );
      // get directory path to save
      let dirPath = document.getElementById("input_dirPath").value;
      console.log(dirPath);
      if (auctionResult.length != 0) {
        // send to Main Process
        let resp = String(
          ipcRenderer.sendSync(
            "createXlsxFile",
            auctionResult,
            dirPath,
            arrAuction[auctionIndex]
          )
        );
        // resc to Main Process
        if (!resp.includes("Error")) {
          //success
          arrSuccessfulAuctionsSaved.push(resp);
        } else {
          //fail
          arrFailedAuctionsSaved.push(resp);
        }
      }
    }
    setStateMsg(
      `(${auctionIndex + 1} / ${auctionCount}) "${
        arrAuction[auctionIndex]
      } 경매 가져오기가 끝났습니다...😎`
    );
    auctionIndex++;
    // arrAuction.shift();
  }
  console.log(
    "ALL LOOPS ARE OVER. A SCRAPER IS ABOUT TO TRY TO TERMINATE THE BROWSER."
  );
  ///////////////// LOOPS /////////////////

  // terminate browser
  browser.close();
  // unset loading state
  unsetLoading();
  //return result
  if (boolRunning) {
    return {
      arrOpenedAuction: arrOpenedAuction,
      arrClosedAuction: arrClosedAuction,
      arrSuccessfulAuctionsSaved: arrSuccessfulAuctionsSaved,
      arrFailedAuctionsSaved: arrFailedAuctionsSaved,
    };
  } else {
    //init toggleCancel
    boolRunning = true;
    return null;
  }
}
function validate() {
  allCheckbox = document.querySelectorAll(
    "#wrapper_checkbox input[type=checkbox]"
  );
  let arrAuction = [];

  for (let i = 0; i < allCheckbox.length; i++) {
    if (allCheckbox[i].checked) {
      arrAuction.push(allCheckbox[i].value);
    }
  }
  if (arrAuction.length == 0) {
    let msg =
      "적어도 경매를 하나는 선택해야 합니다🤷‍♂️\n하나라도 체크해주세요!👍";
    console.log(msg);
    openDialogMsg(msg);
    return null;
  } else {
    return true;
  }
}
function onRunning(el) {
  //check this element is disabled or not
  if (el.classList.contains("disabled")) return;
  if (!validate()) return;
  console.log("RUN!");
  //init url
  let url = "https://www.k-auction.com/Home/SetLanguage?culture=KOR";
  // run scrpaer
  scraper(url)
    .then((res) => {
      console.log(`↓ SCRAPER RESULT ↓\n${res}`);
      //write message for user
      let msg = "";
      if (res == null) {
        msg = `취소되었습니다🔙`;
      } else {
        if (
          res.arrOpenedAuction.length > 0 &&
          res.arrSuccessfulAuctionsSaved.length != 0
        ) {
          if (res.arrClosedAuction.length != 0)
            msg += `열려있지 않은 ${res.arrClosedAuction} 경매를 제외한\n`;
          msg += `${res.arrSuccessfulAuctionsSaved} 저장이 완료되었습니다😁`;
          if (res.arrFailedAuctionsSaved.length != 0)
            msg += `\n하지만 ${res.arrClosedAuction}경매는 파일저장에 실패했습니다😶`;
        } else if (res.arrOpenedAuction.length == 0) {
          msg = `\n열려있는 경매가 없습니다😊`;
        } else {
          throw new Error(
            `ERROR: scraper 결과를 분석할수 없습니다🤦‍♂ \n${res}`
          );
        }
      }
      //report result for user
      openDialogMsg(msg);
    })
    .catch((e) => {
      unsetLoading();
      console.error(e);
      if (e instanceof ReferenceError) {
        showNotification("에러발생!🤦", e);
      } else if (String(e).includes("TimeoutError")) {
        showNotification(
          "에러발생!🤦",
          "페이지를 탐색하지 못했습니다. 사이트 디자인이나 구조가 변경되었을 수 있습니다.😥"
        );
      }
    });
}

function drawTableforDesc(arr) {
  const tbody = document.getElementById("tbody");
  arr.forEach((item) => {
    tbody.innerHTML += `
        <tr>
            <td>${item.number}</td>
            <td>${item.artistKr}</td>
            <td>${item.artistEn}</td>
            <td>${item.titleKr}</td>
            <td>${item.titleEn}</td>
            <td>${item.year}</td>
            <td>${item.certi}</td>
            <td>${item.sizeEdition}</td>
            <td>${item.materialKr}</td>
            <td>${item.materialEn}</td>
            <td>${item.signPosition}</td>
            <td>${item.source}</td>
            <td>${item.auctionTitle}</td>
            <td>${item.transactDate}</td>
            <td>${item.winningBidUnit}</td>
            <td>${item.winningBid}</td>
            <td>${item.estimateUnit}</td>
            <td>${item.estimateMin}</td>
            <td>${item.estimateMax}</td>
        </tr>
`;
  });
}

async function parsing(page) {
  let desc = await page.evaluate(() => {
    let auctionTitle = document.querySelector("title")
      ? document.querySelector("title").innerText
      : "";
    let number = document
      .querySelector(".lot-num")
      ?.innerText.replace(/[^0-9]/g, "");
    let artist = document
      .querySelector(".writer")
      ?.innerHTML.split("<span>")[0]
      .trim();
    let title = document.querySelector(".sub-tit")?.innerText;
    let materialEdition = document
      .querySelector(".material > p:nth-child(1)")
      ?.innerText.trim();

    let material = materialEdition?.split("(edition")[0];
    let edition = materialEdition?.includes("edition")
      ? "(edition" + materialEdition?.split("(edition")[1]
      : "";
    let sizeYear = document
      .querySelector(".material > p:nth-child(2)")
      ?.innerText.replace(/\s/gi, "");
    let size = sizeYear?.split("|")[0];
    let year = sizeYear?.split("|")[1] ? sizeYear?.split("|")[1] : "";
    let estimate = document
      .querySelector(".es-price > p:nth-child(1)")
      ?.innerText.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, "");
    let estimateUnit = estimate?.replace(/[^A-Z]/g, "");
    let estimateMin = estimate?.replace(/[A-Z]/g, "").split("~")[0];
    let estimateMax = estimate?.replace(/[A-Z]/g, "").split("~")[1];
    let signPosition = document
      .querySelector(".cont")
      ?.innerText.split("\n")
      .filter((item) => item.includes("signed"))
      .join("\n");
    let sizeEdition = size + " " + edition;

    let artistKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";
    let artistEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";

    let titleKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";
    let titleEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";

    let materialKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";
    let materialEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";

    let certi = "";
    number = number == undefined ? "" : number;
    artistKr = artistKr == undefined ? "" : artistKr;
    artistEn = artistEn == undefined ? "" : artistEn;
    titleKr = titleKr == undefined ? "" : titleKr;
    titleEn = titleEn == undefined ? "" : titleEn;
    year = year == undefined ? "" : year;
    certi = certi == undefined ? "" : certi;
    sizeEdition = sizeEdition == undefined ? "" : sizeEdition;
    materialKr = materialKr == undefined ? "" : materialKr;
    materialEn = materialEn == undefined ? "" : materialEn;
    signPosition = signPosition == undefined ? "" : signPosition;
    auctionTitle = auctionTitle == undefined ? "" : auctionTitle;
    estimateUnit = estimateUnit == undefined ? "" : estimateUnit;
    estimateMin = estimateMin == undefined ? "" : estimateMin;
    estimateMax = estimateMax == undefined ? "" : estimateMax;
    return {
      number,
      artistKr,
      artistEn,
      titleKr,
      titleEn,
      year,
      certi,
      sizeEdition,
      materialKr,
      materialEn,
      signPosition,
      auctionTitle,
      estimateUnit,
      estimateMin,
      estimateMax,
    };
  });
  return desc;
}
