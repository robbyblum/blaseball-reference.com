export default interface Team {
  id: string;
  lineup: Array<string>;
  rotation: Array<string>;
  bullpen: Array<string>;
  bench: Array<string>;
  seasAttr: Array<string>;
  permAttr: Array<string>;
  fullName: string;
  location: string;
  mainColor: string;
  nickname: string;
  secondaryColor: string;
  shorthand: string;
  emoji: string;
  slogan: string;
  shameRuns: number;
  totalShames: number;
  totalShamings: number;
  seasonShames: number;
  seasonShamings: number;
  championships: number;
  weekAttr: Array<string>;
  gameAttr: Array<string>;
  rotationSlot: number;
  teamSpirit: number;
  card: number;
  slug: string;
}
