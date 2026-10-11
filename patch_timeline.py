import re

with open('routes/Timeline.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { useLocation, useNavigate } from 'react-router-dom';",
                          "import { useLocation, useNavigate } from 'react-router-dom';\nimport { isThisWeek, isThisMonth, isThisYear } from 'date-fns';")

# Add state
content = content.replace("const [filteredDate, setFilteredDate] = useState<Date | null>(null);",
                          "const [filteredDate, setFilteredDate] = useState<Date | null>(null);\n  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');")

# Update logic
new_logic = """
  let entriesToShow = entries;
  if (activeJournal) {
      entriesToShow = entriesToShow.filter(e => (e.journal || 'Personal') === activeJournal);
  }

  if (filteredDate) {
      // Filter by date (ignoring time)
      const filterStr = filteredDate.toISOString().split("T")[0];
      entriesToShow = entriesToShow.filter(e => {
          const eDate = new Date(e.created_at);
          const offset = eDate.getTimezoneOffset();
          const localEDate = new Date(eDate.getTime() - (offset * 60 * 1000));
          return localEDate.toISOString().split("T")[0] === filterStr;
      });
  } else if (timeFilter !== 'all') {
      entriesToShow = entriesToShow.filter(e => {
          const eDate = new Date(e.created_at);
          if (timeFilter === 'week') return isThisWeek(eDate, { weekStartsOn: 1 });
          if (timeFilter === 'month') return isThisMonth(eDate);
          if (timeFilter === 'year') return isThisYear(eDate);
          return true;
      });
  }
"""

content = re.sub(r'  let entriesToShow = entries;.*?\n  }', new_logic, content, flags=re.DOTALL)


# Update props
content = content.replace("onClearFilter={handleClearFilter}",
                          "onClearFilter={handleClearFilter}\n        timeFilter={timeFilter}\n        onTimeFilterChange={setTimeFilter}")

with open('routes/Timeline.tsx', 'w') as f:
    f.write(content)
