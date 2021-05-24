const { ipcRenderer, TouchBarPopover } = require("electron");
const puppeteer = require("puppeteer");
const Store = require("electron-store");

store = new Store();
toggleCancel = true;

//Enter 이벤트 등록
function cancel() {
  console.log("Press the Cancel");
  toggleCancel = false;
  openModal("취소되었습니다.");
  toggleCancel = true;
}

function closeModal(el) {
  document.querySelector("body").style.overflow = "auto";
  el.parentNode.classList.remove("on");
  document.getElementById("dimm").classList.remove("on");
}
function openModal(msg) {
  document.querySelector("body").style.overflow = "hidden";
  document.getElementById("dimm").classList.add("on");
  document.getElementById("modal").classList.add("on");
  document.getElementById("modal").querySelector(".cont").innerText =
    String(msg);
}

async function parsing(page) {
  let info = await page.evaluate(() => {
    const source = document.querySelector("title")?.innerText;
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
    const estimate = document
      .querySelector(".es-price > p:nth-child(1)")
      ?.innerText.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣|\s]/g, "");
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
    const winningBid = "";
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
      estimate,
      source,
      auctionTitle,
      transactDate,
      winningBid,
      signPosition,
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
                    <td>${item.estimate}</td>
                    <td>${item.source}</td>
                    <td>${item.auctionTitle}</td>
                    <td>${item.transactDate}</td>
                    <td>${item.winningBid}</td>
        </tr>
`;
  });
}
async function configureBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--window-size=1280,1080"],
  });
  return browser;
}
async function scraper(url) {
  //init variables
  let res = [];

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
  let pageIndex = 6;
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
function onSubmit() {
  let el_tbody = document.getElementById("tbody");
  if (el_tbody.innerHTML) el_tbody.innerHTML = "";
  let url = "https://www.k-auction.com";
  let filenamePrefix = "kauction";
  let date = "210521";
  scraper(url).then((res) => {
    console.log(res);
    let bool_resp = ipcRenderer.sendSync(
      "create_xlsx",
      res,
      filenamePrefix,
      date
    );
    console.log(bool_resp);
    if (bool_resp) {
      openModal("파일 저장에 성공하였습니다.");
    } else {
      openModal("파일 저장에 실패하였습니다." + bool_resp);
    }
  });
}
