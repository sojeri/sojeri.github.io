const fs = require('fs');

/**
 * metadata about the skills, aka high level details about my work history
 */
const metadata = {
  one: {
    title: "Senior Software Engineer",
    company: "Abridge AI",
    roleType: "tech",
    from: "8/2024", to: "4/2026", years: 1.7,
  },
  two: {
    title: "Software Engineer",
    company: "Spotify",
    roleType: "tech",
    from: "6/2021", to: "3/2024", years: 2.8,
  },
  three: {
    title: "Senior Software Engineer",
    company: "Truss",
    roleType: "tech",
    from: "2/2019", to: "3/2021", years: 2.1,
  },
  four: {
    title: "Software Engineer II",
    company: "Microsoft",
    roleType: "tech",
    from: "12/2015", to: "6/2018", years: 2.6,
  },
  five: {
    title: "Extension Lecturer / TA",
    company: "University of Washington PCE",
    roleType: "tech",
    from: "9/2016", to: "4/2017", years: 0.6,
  },
  six: {
    title: "Full Stack Software Engineering Student",
    company: "Ada Developers Academy",
    roleType: "student",
    from: "5/2015", to: "4/2016", years: 1,
  },
  seven: {
    title: "Office Assistant Manager",
    company: "Indy Stealth Logistics",
    roleType: "delivery / hospitality",
    from: "2014", to: "2015", years: 1,
  },
  eight: {
    title: "Restaurant General Manager",
    company: "Emerald City Pizza",
    roleType: "delivery / hospitality",
    from: "2008", to: "2012", years: 4,
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
function getAggregateSkills() {
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
      const role = rawRole;
      const roleTerm = metadata[rawRole].years;
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

/** prepares the raw JSON for being saved to a file */
function getSkillsAsStrings() {
  const rawSkills = getAggregateSkills();
  let skills;
  try {
    skills = JSON.stringify({
      skills: rawSkills,
      metadata,
    });

  } catch (e) {
    console.error('FATAL: unfortunately I was somehow unable to JSON stringify raw JS object[]');
    throw e;
  }

  return {
    rawSkills,
    skills,
  }
}

/** pulls the skills data and saves it to file */
function saveAggregateSkills() {
  const { skills } = getSkillsAsStrings();

  try {
    fs.writeFileSync('./skills.json', skills);
  } catch (e) {
    console.error('FATAL: oh noes ;_; I failed to save the skills');
    throw e;
  }
}

module.exports = {
  getAggregateSkills,
  saveAggregateSkills,
}