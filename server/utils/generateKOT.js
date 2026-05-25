const generateKOT = () => {

  /*
  CURRENT TIME
  */

  const now = new Date();

  /*
  HOURS
  */

  const hours =
    String(
      now.getHours()
    ).padStart(2,'0');

  /*
  MINUTES
  */

  const minutes =
    String(
      now.getMinutes()
    ).padStart(2,'0');

  /*
  SECONDS
  */

  const seconds =
    String(
      now.getSeconds()
    ).padStart(2,'0');

  /*
  RANDOM
  */

  const random =
    Math.floor(

      100 +

      Math.random() * 900

    );

  /*
  FINAL TOKEN
  */

  return `KOT-${hours}${minutes}${seconds}-${random}`;

};

export {
  generateKOT
};