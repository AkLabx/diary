import re

with open('components/DiaryList.tsx', 'r') as f:
    content = f.read()

# Update DiaryListProps interface
new_interface = """interface DiaryListProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
  onLoadContent: (id: string) => void;
  onThisDayEntries: DiaryEntry[];
  profile: Profile | null;
  filteredDate: Date | null;
  onClearFilter: () => void;
  timeFilter?: 'all' | 'week' | 'month' | 'year';
  onTimeFilterChange?: (filter: 'all' | 'week' | 'month' | 'year') => void;
}"""

content = re.sub(r'interface DiaryListProps \{.*?\n\}', new_interface, content, flags=re.DOTALL)

# Update DiaryList component parameters
content = content.replace(
    "const DiaryList: React.FC<DiaryListProps> = ({ entries, onSelectEntry, onLoadContent, onThisDayEntries, profile, filteredDate, onClearFilter }) => {",
    "const DiaryList: React.FC<DiaryListProps> = ({ entries, onSelectEntry, onLoadContent, onThisDayEntries, profile, filteredDate, onClearFilter, timeFilter = 'all', onTimeFilterChange }) => {"
)

# Add Filter Pills UI right under "Your Timeline"
filter_ui = """
        <>
            <OnThisDay entries={onThisDayEntries} onSelectEntry={onSelectEntry} />
            <div className="flex items-center gap-4 mb-2 mt-4">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Your Timeline, {profile?.full_name?.split(' ')[0] || 'friend'}</h2>
            </div>

            {/* Time Filter Pills */}
            {onTimeFilterChange && (
              <div className="flex flex-wrap gap-2 mt-4 mb-6">
                {(['all', 'week', 'month', 'year'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => onTimeFilterChange(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      timeFilter === filter
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500 hover:bg-indigo-700'
                        : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {filter === 'all' ? 'All Time' : `This ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
                  </button>
                ))}
              </div>
            )}
        </>
"""

content = re.sub(r'        <>\n            <OnThisDay entries=\{onThisDayEntries\} onSelectEntry=\{onSelectEntry\} />\n            <div className="flex items-center gap-4 mb-2 mt-4">\n                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">\n                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">\n                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />\n                    </svg>\n                </div>\n                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Your Timeline, \{profile\?\.full_name\?\.split\(\' \'\)\[0\] \|\| \'friend\'\}</h2>\n            </div>\n        </>', filter_ui, content, flags=re.DOTALL)


with open('components/DiaryList.tsx', 'w') as f:
    f.write(content)
