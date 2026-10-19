const sampleLine = 'The patient was a 73 year old female with a history of hypertension, hypothyroidism and depression who presented to the emergency department with the chief complaint of syncope.';
const sampleLine2 = 'The diagnostic workup showed a normal CBC and electrolyte panel but she did have an elevated d dimer. The chest x ray showed a prominent aortic knob and calcification.';

const DOMAIN_TERMS = [
  'hypertension', 'hypothyroidism', 'depression', 'emergency department', 'syncope',
  'diagnostic workup', 'cbc', 'electrolyte panel', 'd dimer', 'chest x ray', 'aortic knob', 'calcification'
];

const sorted = DOMAIN_TERMS.sort((a,b) => b.length - a.length);
const regex = new RegExp('(\\b' + sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\b|\\b') + '\\b)', 'gi');

console.log('Line 1 matches:', sampleLine.match(regex));
console.log('Line 2 matches:', sampleLine2.match(regex));
