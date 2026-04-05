const fs = require('fs');
const p = 'components/BudgetingCityView.tsx';
let c = fs.readFileSync(p, 'utf8');

// Fix the imports section
c = c.replace(
    "import { useEffect, useRef, useState, useCallback } from 'react';\nimport Link from 'next/link';\nimport dynamic from 'next/dynamic';",
    "import { useEffect, useState, useCallback } from 'react';\nimport dynamic from 'next/dynamic';"
);

fs.writeFileSync(p, c, 'utf8');
console.log('Done');
