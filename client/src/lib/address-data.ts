import realAddressDataRaw from './real-address-data.json';

// 定義 JSON 資料結構
interface TownData {
  town: string;
  zip: string;
}

interface CityData {
  [key: string]: TownData[];
}

interface PrefectureData {
  [key: string]: CityData;
}

// 強制轉型為正確的型別
const realAddressData = realAddressDataRaw as unknown as PrefectureData;

export interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
  block: string;
  fullAddress: string;
}

export function generateRandomAddress(): Address {
  // 從真實資料中隨機選擇
  const prefectures = Object.keys(realAddressData);
  const prefecture = prefectures[Math.floor(Math.random() * prefectures.length)];
  
  const cities = Object.keys(realAddressData[prefecture as keyof typeof realAddressData]);
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  const towns = realAddressData[prefecture as keyof typeof realAddressData][city as keyof typeof realAddressData[keyof typeof realAddressData]];
  const selectedTownData = towns[Math.floor(Math.random() * towns.length)];
  
  const town = selectedTownData.town;
  const postalCode = selectedTownData.zip;
  
  // 生成隨機番地 (1-9 丁目, 1-50 番, 1-50 号)
  // 為了增加真實感，有時候不一定有丁目
  const hasChome = Math.random() > 0.3;
  let block = "";
  
  if (hasChome) {
    const chome = Math.floor(Math.random() * 9) + 1;
    const ban = Math.floor(Math.random() * 50) + 1;
    const go = Math.floor(Math.random() * 50) + 1;
    block = `${chome} 丁目 ${ban} 番 ${go} 号`;
  } else {
    const ban = Math.floor(Math.random() * 1000) + 1;
    const go = Math.floor(Math.random() * 50) + 1;
    block = `${ban} 番地 ${go}`; // 有些地區是番地格式
  }
  
  // 組合完整地址，確保町名與番地間有空格
  const fullAddress = `${prefecture}${city}${town} ${block}`;
  
  return {
    postalCode,
    prefecture,
    city,
    town,
    block,
    fullAddress
  };
}
