const FIRST_CONSTANT = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

const OFFSET = '가'.charCodeAt(0);

const FIRST_OFFSET_RANGE = 21 * 28;
const MIDDLE_OFFSET_RANGE = 28;

const charCode = (first: number, middle: number, last: number) => {
  return String.fromCharCode(OFFSET + first * FIRST_OFFSET_RANGE + middle * MIDDLE_OFFSET_RANGE + last);
};

export const charMatcher = (search = '') => {
  if (!search) {
    return /(?:)/;
  }

  const regex = FIRST_CONSTANT.reduce(
    (accumulator, first, index) =>
      accumulator.replace(new RegExp(first, 'g'), `[${charCode(index, 0, 0)}-${charCode(index + 1, 0, -1)}]`),
    search,
  );

  return new RegExp(`(${regex})`, 'g');
};
