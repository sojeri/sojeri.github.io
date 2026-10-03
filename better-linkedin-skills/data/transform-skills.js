const fs = require('fs');

/**
 * metadata about the skills, aka high level details about my work history
 */
const metadata = {
  one: {
    name: "Abridge (Senior Software Engineer)",
    from: "2024", to: "2026", years: 1.7,
  },
  two: {
    name: "Spotify (Software Engineer)",
    from: "2021", to: "2024", years: 2.8,
  },
  three: {
    name: "Truss (Senior Software Engineer)",
    from: "2019", to: "2021", years: 2.1,
  },
  four: {
    name: "Microsoft (Software Engineer II)",
    from: "2015", to: "2018", years: 2.6,
  },
  five: {
    name: "UW PCE (Extension Lecturer / TA)",
    from: "2016", to: "2017", years: 0.6,
  },
  six: {
    name: "Ada Developers Academy (Full Stack Software Engineering Student)",
    from: "2015", to: "2016", years: 1,
  },
  seven: {
    name: "Indy Stealth Logistics (Office Assistant Manager)",
    from: "2014", to: "2015", years: 1,
  },
  eight: {
    name: "Emerald City Pizza (Restaurant General Manager)",
    from: "shhh", to: "2012", years: 4,
  }
};

/**
 * imports the raw skills data and transform it as needed:
 * - for the tag cloud utility
 * - for the remaining UI
 * 
 * input file contains JSON rows like:
 * { "skill": "cool thing I can do", "role": "some place where I did it" }
 * { "skill": "cool thing I can do", "role": "other place where I did it" }
 * 
 * tag cloud util requires:
 * { value: "cool thing I can do", count: 2 }
 * 
 * UI requires:
 * { ..., roles: ["some place where I did it", "other place where I did it"] }
 *
 */
function getAggregateSkills(isMildlyAnon = false) {
  let rawData, data;

  try {
    rawData = fs.readFileSync('./data.json', { encoding: 'utf8' });
    data = JSON.parse(rawData);
  } catch (e) {
    console.error('FATAL: alas, I cannae find the file or parse it to JSON');
    throw e;
  }
  const output = {};
  data.forEach((row, rowIndex) => {
    try {
      const { skill, role: rawRole } = row;
      const role = isMildlyAnon ? rawRole : metadata[rawRole].name;
      const roleTerm = isMildlyAnon ? 2 : metadata[rawRole].years;
      if (output[skill] === undefined) {
        output[skill] = { value: skill, count: 1, roles: [ role ], duration: roleTerm };
      } else {
        output[skill].count += 1;
        output[skill].duration += roleTerm;
        output[skill].roles.push(role);
      }
    } catch (e) {
      console.error('FATAL: I failed to read and transform the skills ;_;\n', row, rowIndex);
      throw e;
    }
  });
  return Object.values(output);
}

function getSkillsAsStrings() {
  const rawSkills = getAggregateSkills();
  const rawMildlyAnonymousSkills = getAggregateSkills(true);
  let skills, mildlyAnonymousSkills;
  try {
    skills = JSON.stringify(rawSkills);
    mildlyAnonymousSkills = JSON.stringify(rawMildlyAnonymousSkills);
  } catch (e) {
    console.error('FATAL: unfortunately I was somehow unable to JSON stringify raw JS object[]');
    throw e;
  }

  return {
    rawSkills,
    rawMildlyAnonymousSkills,
    skills,
    mildlyAnonymousSkills,
  }
}

/** */
function saveAggregateSkills() {
  const { skills, mildlyAnonymousSkills } = getSkillsAsStrings();

  try {
    fs.writeFileSync('../skills.json', skills);
    fs.writeFileSync('./mildly-anon-skills.json', mildlyAnonymousSkills);
  } catch (e) {
    console.error('FATAL: oh noes ;_; I failed to save the skills');
    throw e;
  }
}

module.exports = {
  getAggregateSkills,
  saveAggregateSkills,
}