const { ipcRenderer, TouchBarPopover } = require("electron");
const puppeteer = require("puppeteer");
const shell = require("electron").shell;
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
      document.getElementById("modal").querySelector(".cont").innerText =
        "문제가 발생했습니다🤦‍♂️\n프로그램을 다시시작해주세요😥\n" + msg;
    } else {
      document.getElementById("modal").querySelector(".cont").innerText = msg;
    }
  } else {
    document.getElementById("modal").querySelector(".cont").innerText =
      "알 수 없는 문제가 발생했습니다.\n" + msg;
  }
}

async function parsing(page) {
  let info = await page.evaluate(() => {
    const source = document.querySelector("title")
      ? document.querySelector("title").innerText
      : "";
    // const auctionTitle = document
    //   .querySelector(".header-cont > div > p > span")
    //   .innerText.split(" -")[0];
    const auctionTitle = document.querySelector(
      ".header-cont > p > span"
    )?.innerText;
    const transactDate = document
      .querySelector(".header-cont > div > p > span")
      ?.innerText.split(" ")
      .slice(0, 3)
      .join(" ");
    const number = document.querySelector(".lot-num")?.innerText;
    const artistBirth = document.querySelector(".writer").innerText;
    const artist = artistBirth?.replace(/\s/gi, "").split("(b.")[0];
    const birth = artistBirth.includes("(b.")
      ? artistBirth?.split("(b.")[1].replace(/[^0-9]/g, "")
      : "";
    const title = document.querySelector(".sub-tit")?.innerText;
    const materialEdition = document
      .querySelector(".material > p:nth-child(1)")
      ?.innerText.replace(/\s/gi, "");

    const material = materialEdition?.split("(edition")[0];
    const edition = materialEdition.includes("edition")
      ? "(edition" + materialEdition?.split("(edition")[1]
      : "";
    const sizeYear = document
      .querySelector(".material > p:nth-child(2)")
      ?.innerText.replace(/\s/gi, "");
    const size = sizeYear?.split("|")[0];
    const year = sizeYear?.split("|")[1];
    const wbPrice = document.querySelector(".wb-price > p:nth-child(1)");
    const winningBidUnit = wbPrice ? wbPrice.replace(/[^A-Z]/g, "") : "";
    const winningBid = wbPrice ? wbPrice.replace(/[A-Z]/g, "") : "";
    const estimate = document
      .querySelector(".es-price > p:nth-child(1)")
      ?.innerText.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, "");
    const estimateUnit = estimate?.replace(/[^A-Z]/g, "");
    const estimateMin = estimate?.replace(/[A-Z]/g, "").split("~")[0];
    const estimateMax = estimate?.replace(/[A-Z]/g, "").split("~")[1];
    const stPrice = document
      .querySelector(".es-price > p:nth-child(2)")
      ?.innerText.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, "");
    const signPosition = document
      .querySelector(".cont")
      ?.innerText.split("\n")
      .filter((item) => item.includes("signed"))
      .join("\n");
    const sizeEdition = size + " " + edition;

    const artistKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";
    const artistEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";

    const titleKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";
    const titleEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";

    const materialKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";
    const materialEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";

    const certi = "";
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

  try {
    while (toggleCancel) {
      //ready for browser
      const browser = await configureBrowser();
      const page = await browser.newPage();
      //access the website
      await page.goto(url, { waitUntil: "domcontentloaded" });

      //access the current premium auction
      await page.hover(".top_nav");
      await page.click(".top_nav .Premium-on > a");
      await page.waitForSelector(".paginate_button.active", { timeout: 3000 });

      //DEPTH-1 : pagination
      let pageIndex = 1;
      while (toggleCancel) {
        pageIndex++;
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
        //access to new paginate page
        paginateButton[pageIndex].click();
        await page.waitForTimeout(500);

        //DEPTH-2 : artworks
        let artworkIndex = 0;
        while (toggleCancel) {
          artworkIndex++;
          let artworkList = await page.$$(".artwork > a");
          //check if artwork exists
          if (artworkList[artworkIndex] == undefined) break;
          //access to new artwork page
          artworkList[artworkIndex].click();
          await page.waitForTimeout(500);
          await page.waitForSelector("#work", { timeout: 5000 });
          //parsing
          let info = await parsing(page);
          res.push(info);
          //displaying
          await display_table([info]);
          //go again
          await page.goBack();
          console.log("artwork " + artworkIndex + " has completed.");
          await page.waitForTimeout(500);
        }
        console.log("Page " + (pageIndex - 1) + " has completed.");
      }
      console.log("All artworks has parsed and scraped.");
      await browser.close();
      return res;
    }
  } catch (e) {
    openModal(e);
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
    scraper(url).then((res) => {
      console.log(res);
      let resp = String(ipcRenderer.sendSync("create_xlsx", res, dirName));
      console.log(resp);
      if (resp && !resp.includes("Error")) {
        fileName = resp;
        openModal('파일이 생성되었습니다😊👍\n"' + resp + '.xlsx"');
      } else {
        openModal("파일생성에 실패했습니다👀\n" + resp);
      }
    });
  }
}
