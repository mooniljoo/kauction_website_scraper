const { ipcRenderer } = require("electron");
const puppeteer = require("puppeteer");
// const shell = require("electron").shell;
const Store = require("electron-store");
const fs = require("fs");

store = new Store();
toggleCancel = true;
fileName = "";

// function openFolder(el) {
//   if (el.classList.contains("disabled")) {
//     console.log("This button is disabled.");
//   } else {
//     let path = "/";
//     console.log("open the folder", path);
//     shell.showItemInFolder(path);
//   }
// }
// function openFile(el) {
//   if (el.classList.contains("disabled")) {
//     console.log("This button is disabled.");
//   } else {
//     if (fileName) {
//       let path = fileName + ".xlsx";
//       console.log("open the file", path);
//       shell.showItemInFolder(path);
//     }
//   }
// }
function createFolder(dirName) {
  !fs.existsSync(dirName) && fs.mkdirSync(dirName);
}
function onPress() {
  if (event.keyCode == 13) onSubmit(document.getElementById("btnRunning"));
}
function setLoading() {
  document.querySelector("nav").classList.add("loading");
  document.getElementById("btnRunning").classList.add("disabled");
  document.getElementById("btnCancel").classList.remove("disabled");
  document.getElementById("input_dirName").setAttribute("disabled", "disabled");
  document.getElementById("input_dirName").classList.add("disabled");
  // document.getElementById("btnOpenfile").classList.add("disabled");
}
function unsetLoading() {
  document.querySelector("nav").classList.remove("loading");
  document.getElementById("btnRunning").classList.remove("disabled");
  document.getElementById("btnCancel").classList.add("disabled");
  document.getElementById("input_dirName").removeAttribute("disabled");
  document.getElementById("input_dirName").classList.remove("disabled");
  // document.getElementById("btnOpenfile").classList.remove("disabled");
}
function cancel(el) {
  if (el.classList.contains("disabled")) {
    console.log("This button is disabled.");
  } else {
    console.log("Press the Cancel");
    toggleCancel = false;
    openModal("취소되었습니다.");
  }
}
function closeModal(el) {
  document.querySelector("body").style.overflow = "auto";
  el.parentNode.classList.remove("on");
  document.getElementById("dimm").classList.remove("on");
  toggleCancel = true;
}
function openModal(msg) {
  document.querySelector("body").style.overflow = "hidden";
  document.getElementById("dimm").classList.add("on");
  document.getElementById("modal").classList.add("on");
  unsetLoading();
  if (msg) {
    msg = String(msg);
    if (msg.includes("Error")) {
      // if (true) {
      toggleCancel = false;
      document.getElementById("modal").querySelector(".cont").innerText =
        "문제가 발생했습니다🤦‍♂️\n프로그램을 다시시작해주세요😥\n" + msg;
      ipcRenderer.sendSync("display_error", msg);
    } else {
      document.getElementById("modal").querySelector(".cont").innerText = msg;
    }
  } else {
    document.getElementById("modal").querySelector(".cont").innerText =
      "알 수 없는 문제가 발생했습니다.\n" + msg;
    ipcRenderer.sendSync("display_error", msg);
  }
}

async function parsing(page) {
  console.log("parsing start");
  let info = await page.evaluate(() => {
    let source = document.querySelector("title")
      ? document.querySelector("title").innerText
      : "";
    // let auctionTitle = document
    //   .querySelector(".header-cont > div > p > span")
    //   .innerText.split(" -")[0];
    let auctionTitle = document.querySelector(
      ".header-cont > p > span"
    )?.innerText;
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
    number == undefined ? "" : number;
    artistKr == undefined ? "" : artistKr;
    artistEn == undefined ? "" : artistEn;
    titleKr == undefined ? "" : titleKr;
    titleEn == undefined ? "" : titleEn;
    year == undefined ? "" : year;
    certi == undefined ? "" : certi;
    sizeEdition == undefined ? "" : sizeEdition;
    materialKr == undefined ? "" : materialKr;
    materialEn == undefined ? "" : materialEn;
    signPosition == undefined ? "" : signPosition;
    source == undefined ? "" : source;
    auctionTitle == undefined ? "" : auctionTitle;
    transactDate == undefined ? "" : transactDate;
    winningBidUnit == undefined ? "" : winningBidUnit;
    winningBid == undefined ? "" : winningBid;
    estimateUnit == undefined ? "" : estimateUnit;
    estimateMin == undefined ? "" : estimateMin;
    estimateMax == undefined ? "" : estimateMax;
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
      winningBidUnit,
      winningBid,
      estimateUnit,
      estimateMin,
      estimateMax,
    };
  });
  console.log(info);
  return info;
}

function display_table(arr) {
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
async function configureBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--window-size=1280,1080"],
  });
  return browser;
}
async function scraper(url) {
  setLoading();
  //init variables
  let res = [];

  while (toggleCancel) {
    //ready for browser
    const browser = await configureBrowser();
    const page = await browser.newPage();
    //access the website
    await page.goto(url, { waitUntil: "domcontentloaded" });

    //access the current premium auction
    const str_auction = document.getElementById("select_auction").value;
    await page.hover(".top_nav");
    console.log("auction : ", str_auction);
    let auction;
    if (str_auction == "premium") {
      auction = await page.$(".top_nav .Premium-on > a");
    } else if (str_auction == "weekly") {
      auction = await page.$(".top_nav .Weekly-on > a");
    } else {
      openModal("불러올 옥션을 선택할 때 문제가 발생했습니다.");
    }
    console.log(auction);
    if (auction == null) {
      openModal("경매가 열리지 않았습니다.");
      break;
    } else {
      await auction.click();
    }

    //DEPTH-1 : pagination
    let pageIndex = 2;
    while (toggleCancel) {
      await page.waitForTimeout(500);
      await page.waitForSelector(".paginate_button.active", { timeout: 9000 });
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
      if (pageIndex > 12) pageIndex = 2;
      //access to new paginate page
      let textContent = await paginateButton[pageIndex].getProperty(
        "textContent"
      );
      let className = await paginateButton[pageIndex].getProperty("className");
      console.log(textContent);
      console.log(className);

      paginateButton[pageIndex].click();
      await page.waitForTimeout(1000);
      await page.waitForSelector(".artwork > a", { timeout: 9000 });

      //DEPTH-2 : artworks
      let artworkIndex = 0;
      while (toggleCancel) {
        let artworkList = await page.$$(".artwork > a");
        //check if artwork exists
        if (artworkList[artworkIndex] == undefined) break;
        //access to new artwork page
        artworkList[artworkIndex].click();
        await page.waitForTimeout(500);
        await page.waitForSelector("#work", { timeout: 9000 });
        //parsing
        let info = await parsing(page);
        console.log(info);
        res.push(info);
        //displaying
        await display_table([info]);
        //go again
        await page.goBack();
        console.log("artwork " + (artworkIndex + 1) + " has completed.");
        await page.waitForTimeout(500);
        artworkIndex++;
      }
      console.log("Page " + (pageIndex - 1) + " has completed.");
      pageIndex++;
    }
    console.log("All artworks has parsed and scraped.");
    await browser.close();
    return res;
  }
}
function onSubmit(el) {
  if (el.classList.contains("disabled")) {
    console.log("This button is disabled.");
  } else {
    let el_tbody = document.getElementById("tbody");
    if (el_tbody.innerHTML) el_tbody.innerHTML = "";
    let url = "https://www.k-auction.com/Home/SetLanguage?culture=KOR";
    dirName = document.getElementById("input_dirName").value;
    if (dirName) createFolder(dirName);
    scraper(url)
      .then((res) => {
        console.log(res);
        let resp = String(ipcRenderer.sendSync("create_xlsx", res, dirName));
        console.log(resp);
        if (resp == "" || resp == undefined || resp.includes("Error")) {
          openModal("파일생성에 실패했습니다👀\n" + resp);
        } else {
          fileName = resp;
          openModal('파일이 생성되었습니다😊👍\n"' + resp + '.xlsx"');
        }
      })
      .catch((error) => {
        console.error(error);
        openModal(error);
      });
  }
}
