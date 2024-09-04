const fs = require('fs');

const skills = JSON.parse(fs.readFileSync('skills.json'));
const result = JSON.parse(fs.readFileSync('result.json'));

result.forEach(newSkill => {
  if (hasSkill(newSkill)) {
    console.log('found dup:', newSkill.name);
  } else {
    skills.push(newSkill);
  }
});

const sortedSkills = skills.sort((a, b) => a.name > b.name ? 1 : -1);
fs.writeFileSync('skills.new.json', JSON.stringify(sortedSkills, null, 2));

function hasSkill(newSkill) {
  const found = skills.find(skill => {
    return newSkill.name === skill.name;
  });
  return found;
}