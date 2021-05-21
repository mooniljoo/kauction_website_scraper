const { ipcRenderer, TouchBarPopover } = require("electron");
const puppeteer = require("puppeteer");
const Store = require("electron-store");

store = new Store();

// //Enter 이벤트 등록
// function getUrlInput() {
//   let url = document.getElementById("url").value;
//   return url;
// }
// function toggleCancel() {
//   console.log("cancel");
// }

function closeModal(el) {
  el.parentNode.classList.remove("on");
  document.getElementById("dimm").remove("on");
}
function display_error(e) {
  document.getElementById("dimm").classList.add("on");
  document.getElementById("modal").classList.add("on");
  document.getElementById("modal").querySelector(".cont").innerText = String(e);
}

function onPress() {
  if (event.key == "Enter") {
    onSubmit();
  }
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
  await page.goto(url);

  //access the current premium auction
  await page.hover(".top_nav");
  await page.click(".top_nav .Premium-on > a");
  await page.waitForSelector(".artwork", { timeout: 3000 });

  //DEPTH-1 : pagination
  let pageIndex = 1;
  while (true) {
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
    while (true) {
      artworkIndex++;
      let artworkList = await page.$$(".artwork > a");
      //check if artwork exists
      if (artworkList[artworkIndex] == undefined) break;
      //access to new artwork page
      artworkList[artworkIndex].click();
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
  let url = "https://www.k-auction.com";
  scraper(url).then((res) => {
    console.log(res);
    // console.log(ipcRenderer.sendSync("console-display", res));
  });
}

// async function parsing(page) {
//   let html = await page.evaluate(() => {
//     let q = [];
//     let ls = document.querySelectorAll(".list-pd");
//     let source = document.querySelector("title").innerText;
//     let auctionTitle = document.querySelector(".subtop-desc > h1").innerText;
//     ls.forEach((item) => {
//       const mainInfo = item.querySelector(".card.artwork");
//       const number =
//         mainInfo.querySelector(".lot").innerText.split("LOT ")[1] || "";
//       const artist = mainInfo.querySelector(".card-title").innerText || "";
//       const title = mainInfo.querySelector(".card-subtitle").innerText || "";
//       const description =
//         mainInfo.querySelector(".description").innerText || "";
//       const yearMaterial = description.split("\n")[0];
//       const year = yearMaterial.replace(/[^0-9]/g, "").trim();
//       const material = yearMaterial.replace(/[0-9]/g, "").trim();
//       const sizeEdition = description.split("\n")[1];
//       const estimate =
//         mainInfo
//           .querySelector(".list-inline-item.font-numbers")
//           .innerText.replace("\n", " ") || "";

//       const artistKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";
//       const artistEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(artist) ? artist : "";

//       const titleKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";
//       const titleEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) ? title : "";

//       const materialKr = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";
//       const materialEn = !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(material) ? material : "";

//       const certi = "";
//       const signPosition = "";
//       const transactDate = "";
//       const winningBid = "";
//       q.push({
//         number,
//         artistKr,
//         artistEn,
//         titleKr,
//         titleEn,
//         year,
//         certi,
//         sizeEdition,
//         materialKr,
//         materialEn,
//         signPosition,
//         estimate,
//         source,
//         auctionTitle,
//         transactDate,
//         winningBid,
//       });
//     });
//     return q;
//   });
//   return html;
// }

// async function scraper(url) {
//   let finalItems = [];
//   const browser = await configureBrowser();
//   const page = await browser.newPage();
//   await page.goto(url);
//   let items = await page.$$(".paginate_button.page-item");
//   let i = 2;
//   while (i < items.length) {
//     console.log("파싱실행", i);
//     let artworks = await parsing(page);
//     const tbody = document.getElementById("tbody");
//     // if (tbody.hasChildNodes()) {}

//     console.log(artworks);
//     artworks.forEach((el) => {
//       tbody.innerHTML += `
//         <tr>
//             <td>${el.number}</td>
//             <td>${el.artistKr}</td>
//             <td>${el.artistEn}</td>
//             <td>${el.titleKr}</td>
//             <td>${el.titleEn}</td>
//             <td>${el.year}</td>
//             <td>${el.certi}</td>
//             <td>${el.sizeEdition}</td>
//             <td>${el.materialKr}</td>
//             <td>${el.materialEn}</td>
//             <td>${el.signPosition}</td>
//             <td>${el.estimate}</td>
//             <td>${el.source}</td>
//             <td>${el.auctionTitle}</td>
//             <td>${el.transactDate}</td>
//             <td>${el.winningBid}</td>
//         </tr>
//     `;
//       // event.sender.send("bar", res);
//       // jsonToXlsx.write("test.xlsx", "testSheet", res);
//     });
//     finalItems.push(...artworks);

//     //pagination part
//     let el = await page.$(
//       ".paginate_button.page-item:nth-child(" + (i + 2) + ")"
//     );
//     if (el) {
//       console.log("다음페이지클릭");
//       el.click();
//       console.log("렌더링 대기");
//       await page.waitForSelector(".card");
//       await page.waitForTimeout(500);
//       i += 1;
//     } else {
//       console.log(`${i - 1}개의 페이지네이션 종료`);
//       await page.close();
//       break;
//     }
//   }
//   await browser.close();
//   return finalItems;
// }

// function onSubmit() {
//   let url = getUrlInput();
//   scraper(url).then((res) => {
//     console.log(res);
//     console.log(ipcRenderer.sendSync("console-display", res));
//   });
// }
