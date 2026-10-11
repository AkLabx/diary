import re

with open('components/DiaryList.tsx', 'r') as f:
    content = f.read()

# Make DiaryListItem accept monthIndex prop
content = content.replace(
    "const DiaryListItem: React.FC<{ \n    entry: DiaryEntry; \n    onLoadContent: (id: string) => void; \n}> = ({ entry, onLoadContent }) => {",
    "import { getMonthColorClass, getMonthBorderClass } from '../lib/colorUtils';\n\nconst DiaryListItem: React.FC<{ \n    entry: DiaryEntry; \n    onLoadContent: (id: string) => void; \n    monthIndex?: number; \n}> = ({ entry, onLoadContent, monthIndex }) => {"
)


# Add getMonthColor logic to DiaryListItem styles
content = content.replace(
    "className=\"block bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-1\"",
    "className={`block bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 hover:-translate-y-1 ${monthIndex !== undefined ? getMonthColorClass(monthIndex) : ''} ${monthIndex !== undefined ? getMonthBorderClass(monthIndex) : 'hover:border-indigo-400 dark:hover:border-indigo-500'}`}"
)

# Render logic update: calculate monthIndex and pass to DiaryListItem
content = content.replace(
    "<DiaryListItem\n                             key={entry.id}\n                             entry={entry}\n                             onLoadContent={onLoadContent}\n                          />",
    "<DiaryListItem\n                             key={entry.id}\n                             entry={entry}\n                             onLoadContent={onLoadContent}\n                             monthIndex={new Date(entry.created_at).getMonth()}\n                          />"
)


with open('components/DiaryList.tsx', 'w') as f:
    f.write(content)
