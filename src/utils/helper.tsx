export const formatNumber = (number: any) => {
  let value;
  if (number !== undefined && +number > 0) {
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
    value = formatter.format(+number);
  } else {
    value = `0`;
  }

  return value;
};

export const floored_val = (val: number, digits: number) => {
  const power = Math.pow(10, digits);
  return +(Math.floor(val * power) / power).toFixed(digits);
}

export const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};


export const separatedArray = (array: any, itemsPerArray: number) => {
  const separatedArrays = [];
  for (let i = 0; i < array.length; i += itemsPerArray) {
    const separatedArray = array.slice(i, i + itemsPerArray);
    separatedArrays.push(separatedArray);
  }
  return separatedArrays;
}

export const generateRandomPrice = (minPrice: number, maxPrice: number, numDecimalDigits?: number) => {
  return floored_val(
    Math.random() * (maxPrice - (minPrice)) + minPrice,
    numDecimalDigits || 4,
  ); 
}

const generateRandomArrayAmount = (totalAmount: number, elementCount: number, maxAmountPerElement: number) => {
  if (totalAmount <= 0 || elementCount <= 0 || maxAmountPerElement <= 0) {
      return [];
  }

  const result = [];
  let remainingAmount = totalAmount;

  for (let i = 0; i < elementCount - 1; i++) {
      const randomValue = Math.random() * Math.min(maxAmountPerElement, remainingAmount);
      result.push(randomValue);
      remainingAmount -= randomValue;
  }

  result.push(remainingAmount);

  return result.map(value => Math.min(value, maxAmountPerElement));
}

const sumArray = (array: number[]) =>{
  return array.reduce((sum, value) => sum + value, 0);
}


export const generateRandomArrayFromData = (totalAmount: number, elementCount: number, maxAmountPerElement: number) => {
  let randomArray;
  do {
    randomArray = generateRandomArrayAmount(totalAmount, elementCount, maxAmountPerElement);
  } while (sumArray(randomArray) !== totalAmount);
}
