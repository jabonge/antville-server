import { LexoRank } from 'lexorank';

export function genLexoRankList(count: number) {
  const middle = LexoRank.middle();
  const leftArray = [];
  const rightArray = [];
  const halfNumber = parseInt((count / 2).toString(), 10);
  let temp;
  if (count % 2 === 0) {
    temp = middle;
    for (let i = halfNumber - 1; i > 0; i--) {
      temp = getPrev(3, temp);
      leftArray.push(temp);
    }
    temp = middle;
    for (let i = 1; i <= halfNumber; i++) {
      temp = getNext(3, temp);
      leftArray.push(temp);
    }
  } else {
    temp = middle;
    for (let i = halfNumber; i > 0; i--) {
      temp = getPrev(3, temp);
      leftArray.push(getPrev(i, temp));
    }
    temp = middle;
    for (let i = 1; i <= halfNumber; i++) {
      temp = getNext(3, temp);
      leftArray.push(temp);
    }
  }
  return [...leftArray, middle, ...rightArray];
}

function getPrev(num: number, lexorank: LexoRank) {
  let temp = lexorank;
  for (let i = 0; i < num; i++) {
    temp = temp.genPrev();
  }
  return temp;
}

function getNext(num: number, lexorank: LexoRank) {
  let temp = lexorank;
  for (let i = 0; i < num; i++) {
    temp = temp.genNext();
  }
  return temp;
}
