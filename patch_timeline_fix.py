import re

with open('routes/Timeline.tsx', 'r') as f:
    content = f.read()

# Remove the duplicated filteredDate block
content = re.sub(r'\n  if \(filteredDate\) \{\n      // Filter by date \(ignoring time\)\n      // Note: We need to match local date string\n      const filterStr = filteredDate\.toISOString\(\)\.split\("T"\)\[0\];\n      entriesToShow = entriesToShow\.filter\(e => \{\n          const eDate = new Date\(e\.created_at\);\n          // Adjust for timezone offset to compare local dates\n          const offset = eDate\.getTimezoneOffset\(\);\n          const localEDate = new Date\(eDate\.getTime\(\) - \(offset \* 60 \* 1000\)\);\n          return localEDate\.toISOString\(\)\.split\("T"\)\[0\] === filterStr;\n      \}\);\n  \}\n', '', content)

with open('routes/Timeline.tsx', 'w') as f:
    f.write(content)
