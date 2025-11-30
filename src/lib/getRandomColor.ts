const getRandomValue = (start: number, end: number) => Math.floor(Math.random() * (end - start) + start);

/* const calculateLuminance = (r: number, g: number, b: number) => {
  const [rNormalized, gNormalized, bNormalized] = [r, g, b].map((value) => value / 255);

  const [rLuminance, gLuminance, bLuminance] = [rNormalized, gNormalized, bNormalized].map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * rLuminance + 0.7152 * gLuminance + 0.0722 * bLuminance;
};
 */
export const getRandomHexColor = (): string => {
	const HEX = '0123456789abcdef';
	const rr = `${HEX[getRandomValue(0, 15)]}${HEX[getRandomValue(0, 15)]}`;
	const gg = `${HEX[getRandomValue(0, 15)]}${HEX[getRandomValue(0, 15)]}`;
	const bb = `${HEX[getRandomValue(0, 15)]}${HEX[getRandomValue(0, 15)]}`;

	return `#${rr}${gg}${bb}`;
};
