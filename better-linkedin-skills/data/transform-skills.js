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
//
// utils for crafting the story skills metadata
//

/** get rough years of experience */
const getStoryObjDuration = (obj) => {
  const start = obj?.start;
  const end = obj?.end;
  const objType = obj?.type;
  if (objType === 'project') return 0.25;

  let duration;
  if (end !== 'Present') {
    duration = end?.year - start?.year;
  } else {
    duration = new Date().getFullYear() - start?.year;
  }

  if (Number.isNaN(duration)) {
    duration = 0.5;
  }

  return duration === 0 ? 0.25 : duration;
}

/** get rough date string for from/to fields */
const getDateString = (field={}) => {
  if (typeof field === 'string') return field;

  const { month, year } = field;
  if (month !== undefined && year !== undefined) {
    return `${month}/${year}`;
  }
  if (year !== undefined) {
    return `${year}`;
  }

  return 'A TIME UNKNOWN';
}

/** get role info with separate title/company where possible */
const getRoleInfo = (obj) => {
  const title = obj?.title;
  const objType = obj?.type;
  let adjustedTitle, adjustedCompany;

  if (title.indexOf(' at ') > -1) {
    const titleParts = title.split(' at ');
    const [role, company] = titleParts;
    if (role?.length) {
      adjustedTitle = role;
    }
    if (company?.length) {
      adjustedCompany = company;
    }
  }

  if (adjustedTitle === undefined) {
    adjustedTitle = title;
  }

  if (adjustedCompany === undefined) {
    switch (objType) {
      case 'project':
        adjustedCompany = 'Side Project';
        break;
      case 'education':
        adjustedCompany = 'Ada Developers Academy';
        break;
      default:
        adjustedCompany = 'A COMPANY UNKNOWN';
    }
  }

  return {
    adjustedTitle,
    adjustedCompany,
  }
}

/** calculate full role metadata for a story role */
const getRoleMetadata = (obj) => {
  const start = obj?.start;
  const end = obj?.end;
  const duration = getStoryObjDuration(obj);
  const adjustedStart = getDateString(start);
  const adjustedEnd = getDateString(end);
  const {adjustedCompany, adjustedTitle} = getRoleInfo(obj);

  return {
    title: adjustedTitle,
    company: adjustedCompany,
    from: adjustedStart,
    to: adjustedEnd,
    years: duration,
  }
}

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
  let rawData, rawStoryData, data, storyData;

  try {
    rawData = fs.readFileSync('./data.json', { encoding: 'utf8' });
    rawStoryData = fs.readFileSync('./story-data.json', { encoding: 'utf8' });
    data = JSON.parse(rawData);
    storyData = JSON.parse(rawStoryData);
  } catch (e) {
    console.error('FATAL: alas, I cannae find the file or parse it to JSON');
    throw e;
  }
  const output = {};
  const storyOutput = {};
  const storyMetadata = {};
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

  storyData.forEach((obj, objIndex) => {
    const objType = obj?.type;
    if (
      objType === 'metadata'
      || objType === 'summary'
      || objType === 'achievement'
      || objType === 'title'
    ) return;

    try {
      const skills = obj?.skills || [];
      const title = obj?.title || '';

      const roleMetadata = getRoleMetadata(obj);
      const { years: duration, title: roleName, } = roleMetadata;
      storyMetadata[roleName] = roleMetadata;

      // ignore data irrelevant to skills cloud
      if (skills === undefined || skills.length === 0) {
        return;
      }

      skills.forEach(skill => {
        if (storyOutput[skill] === undefined) {
          storyOutput[skill] = { value: skill, count: 1, roles: [ roleName ], duration };
        } else {
          storyOutput[skill].count += 1;
          storyOutput[skill].duration += duration;
          storyOutput[skill].roles.push(roleName);
        }
      })
    } catch (e) {
      console.error('FATAL: I failed to read and transform the developer story skills ;_;\n', obj, objIndex);
      throw e;
    }
  })
  return {
    rawSkills: Object.values(output),
    rawStorySkills: Object.values(storyOutput),
    storyMetadata,
  };
}

/** prepares the raw JSON for being saved to a file */
function getSkillsAsStrings() {
  const { rawSkills, rawStorySkills, storyMetadata } = getAggregateSkills();
  let skills, storySkills;
  try {
    skills = JSON.stringify({
      skills: rawSkills,
      metadata,
    });
    storySkills = JSON.stringify({
      skills: rawStorySkills,
      metadata: storyMetadata,
    });
  } catch (e) {
    console.error('FATAL: unfortunately I was somehow unable to JSON stringify raw JS object[]');
    throw e;
  }

  return {
    rawSkills,
    skills,
    rawStorySkills,
    storySkills,
  }
}

/** pulls the skills data and saves it to file */
function saveAggregateSkills() {
  const { skills, storySkills } = getSkillsAsStrings();

  try {
    fs.writeFileSync('./skills.json', skills);
  } catch (e) {
    console.error('FATAL: oh noes ;_; I failed to save the skills');
    throw e;
  }

  try {
    fs.writeFileSync('./story-skills.json', storySkills);
  } catch (e) {
    console.error('FATAL: oh noes ;_; I failed to save the developer story skills');
    throw e;
  }
}

module.exports = {
  getAggregateSkills,
  saveAggregateSkills,
}