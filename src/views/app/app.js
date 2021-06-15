const { ipcRenderer } = require("electron");
const puppeteer = require("puppeteer");
const rootPath = require("electron-root-path").rootPath;
const shell = require("electron").shell;

let boolRunning = true;

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("Scraper DOM fully loaded");
  document.getElementById("input_dirPath").value = rootPath;
});

function openDialogMsg(msg) {
  ipcRenderer.sendSync("openDialogMsg", msg);
}
function openDialogError(msg) {
  ipcRenderer.sendSync("openDialogError", msg);
}
function setLoading() {
  document.getElementById("stateMsg").innerText = "불러오는 중입니다...";
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

function onCancel(el) {
  //check this element is disabled or not
  if (el.classList.contains("disabled")) return;
  // show msg to screen for user
  document.getElementById("stateMsg").innerText = "취소중입니다...";
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
  const arrAuction = getArrAuction();
  const arrClosedAuction = [];
  const arrOpenedAuction = [];
  const arrSuccessfulAuctionsSaved = [];
  const arrFailedAuctionsSaved = [];
  // check for auctions to scrape
  if (arrAuction == null) return false;
  console.log(`"${arrAuction}" auctions ARE SELECTED.`);

  // ready for browser
  const browser = await configureBrowser();
  const page = await browser.newPage();
  //access the website
  await page.goto(url, { waitUntil: "domcontentloaded" });

  ///////////////// LOOPS /////////////////
  console.log("BROWSER IS READY. LOOPS ARE ABOUT TO START!");
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
    console.log(
      `TRY TO "${arrAuction[auctionIndex]} auction" SCRAPING. TRY TO GET ELEMENT FOR ACCESS AUCTION PAGE`
    );
    let selector_auction;
    if (arrAuction[auctionIndex] == "major") {
      selector_auction = ".top_nav .Major-on > a";
    } else if (arrAuction[auctionIndex] == "premium") {
      selector_auction = ".top_nav .Premium-on > a";
    } else if (arrAuction[auctionIndex] == "weekly") {
      selector_auction = ".top_nav .Weekly-on > a";
    } else {
      console.error(
        `웹사이트의 구조가 바뀌었거나 선택하여 불러오려고 하는 옥션의 설정값(${arrAuction[auctionIndex]})이 시스템에 저장되어 있지 않습니다.`
      );
      break;
    }

    const button_auction = await page.$(selector_auction);
    if (button_auction == null) {
      console.log(
        `선택자가 페이지상에 존재하지 않는것으로 보아\n${arrAuction[auctionIndex]}경매가 아직 열리지 않았습니다.`
      );
      arrClosedAuction.push(arrAuction[auctionIndex]);
    } else {
      arrOpenedAuction.push(arrAuction[auctionIndex]);
      //init auctionResult
      let auctionResult = [];
      // acess the auction
      console.log("ELEMENT TO ACCESS AUCTION CLICK!");
      button_auction.click();
      //DEPTH 2 : pagination
      let pageIndex = 2;
      let pageCount = 0;
      while (boolRunning) {
        // parsing outer description of artwork
        await page.waitForTimeout(1000);

        let outerDesc;
        let winningBid = "";
        let winningBidUnit = "";
        //scraping winningBid
        const elem_winningBid = await page.$(
          "#list ul:nth-child(4) > li.list-inline-item:nth-child(2)"
        );
        if (elem_winningBid != null) {
          let winningBid = await elem_winningBid.evaluate((el) => el.innerText);
          let winningBidUnit = winningBid?.replace(/[^A-Z]/g, "");
          winningBid = winningBid?.replace(/[A-Z]/g, "");
          winningBid = winningBid == undefined ? "" : winningBid;
          winningBidUnit = winningBidUnit == undefined ? "" : winningBidUnit;
        }
        outerDesc = { winningBid, winningBidUnit };

        ///// ready for next page
        await page.waitForTimeout(500);
        await page.waitForSelector(".paginate_button.active", {
          timeout: 9000,
        });
        let paginateButton = await page.$$(".paginate_button.page-item > a");
        let bool_isNextButtonDisabled = await page.$eval(
          ".paginate_button.active",
          (el) => {
            return el.nextElementSibling.classList.contains("disabled");
          }
        );
        //check if paginate button is disabled
        console.log("bool_isNextButtonDisabled", bool_isNextButtonDisabled);
        if (bool_isNextButtonDisabled) break;
        paginateButton[pageIndex].click();
        if (pageIndex == paginateButton.length - 2) pageIndex = 2;

        //DEPTH 3 : artwork
        let artworkIndex = 0;
        let artworkCount = 0;
        while (boolRunning) {
          await page.waitForTimeout(500);
          const list = await page.waitForSelector("#list", { timeout: 9000 });
          const arrArtwork = await list.$$(".artwork > a");
          artworkCount = arrArtwork.length;
          //check if artwork exists
          if (arrArtwork[artworkIndex] == undefined) break;
          //access to new artwork page
          arrArtwork[artworkIndex].click();

          // parsing inner description of artwork
          await page.waitForTimeout(500);
          await page.waitForSelector("#work", { timeout: 9000 });
          let innerDesc = await parsing(page);
          description = { ...outerDesc, ...innerDesc };
          console.log(
            `(${artworkIndex + 1}/${artworkCount}) ${description.number}|${
              description.artistKr || description.artistEn
            }|${description.titleKr || description.titleEn} has completed.`
          );
          auctionResult.push(description);
          // displaying description
          await drawTableforDesc([description]);
          // go again
          await page.goBack();
          artworkIndex++;
        }

        pageIndex++;
      }
      console.log(`${arrAuction[auctionIndex]}경매 파싱을 마쳤습니다.`);

      console.log(
        `${auctionResult.length}개의 작품이 ${arrAuction[auctionIndex]}경매에서 파싱되었습니다.`
      );
      // get directory path to save
      let dirPath = document.getElementById("input_dirPath").value;
      console.log(dirPath);
      if (auctionResult.length != 0) {
        // send to Main Process
        let resp = String(
          ipcRenderer.sendSync("createXlsxFile", auctionResult, dirPath)
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
    console.log(
      `(${auctionIndex + 1} / ${auctionCount}) "${
        arrAuction[auctionIndex]
      } auction" has completed.`
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
          msg = `ERROR: scraper 결과를 분석할수 없습니다🤦‍♂ \n${res}`;
        }
      }
      //report result for user
      openDialogMsg(msg);
    })
    .catch((err) => {
      openDialogError(err);
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
  try {
    let desc = await page.evaluate(() => {
      let auctionTitle = document.querySelector("title")
        ? document.querySelector("title").innerText
        : "";
      let source = document.querySelector(".header-cont > p > span")?.innerText;
      let transactDate = document
        .querySelector(".header-cont > div > p > span")
        ?.innerText.split(" ")
        .slice(0, 3)
        .join(" ");
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
      let wbPrice = document.querySelector(".wb-price > p:nth-child(1)");
      let winningBidUnit = wbPrice ? wbPrice.replace(/[^A-Z]/g, "") : "";
      let winningBid = wbPrice ? wbPrice.replace(/[A-Z]/g, "") : "";
      let estimate = document
        .querySelector(".es-price > p:nth-child(1)")
        ?.innerText.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, "");
      let estimateUnit = estimate?.replace(/[^A-Z]/g, "");
      let estimateMin = estimate?.replace(/[A-Z]/g, "").split("~")[0];
      let estimateMax = estimate?.replace(/[A-Z]/g, "").split("~")[1];
      let stPrice = document
        .querySelector(".es-price > p:nth-child(2)")
        ?.innerText.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, "");
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
      source = source == undefined ? "" : source;
      auctionTitle = auctionTitle == undefined ? "" : auctionTitle;
      transactDate = transactDate == undefined ? "" : transactDate;
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
        source,
        auctionTitle,
        transactDate,
        estimateUnit,
        estimateMin,
        estimateMax,
      };
    });
    console.log("description", desc);
    return desc;
  } catch (e) {
    console.error("파싱중 오류가 발생헀습니다🤦‍♂️");
    return null;
  }
}
