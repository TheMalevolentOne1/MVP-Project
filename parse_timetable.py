from bs4 import BeautifulSoup

# Load HTML from a file (replace 'timetable.html' with your actual file)
with open('timetable.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

# Print the title to verify loading
print(soup.title.string)
