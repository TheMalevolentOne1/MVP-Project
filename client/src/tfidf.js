/*
ALGORITHM SOURCE: https://www.learndatasci.com/glossary/tf-idf-term-frequency-inverse-document-frequency/
*/

/*
Brief: A Set of unique words that are filtered out due to commonality of usage.
NOTE: "how", "use", "what" etc. are intentionally excluded here compared to classic stop word lists
because they are common in note titles (e.g. "How to use Git", "What is React").
*/
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'its', 'was', 'are', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
    'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'as',
    'if', 'then', 'than', 'that', 'this', 'these', 'those', 'i', 'me',
    'my', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'they',
    'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why'
]);

/*
Brief: Normalisation of text for TF-IDF processing.
1) Conversion to lowercase
2) Splitting text on whitespace, punctuation, and special characters
3) Removal of stop words and single-character terms
*/
const tokenise = (text) => {
    let parsedText = text.toLowerCase().split(/\W+/);
    return parsedText.filter(term => term.length > 1 && !STOP_WORDS.has(term));
};

/*
Brief:  strips punctuation and single chars
Used as a fallback when the user's query consists entirely of stop words (e.g. "how to use").
*/
const tokeniseRaw = (text) => {
    return text.toLowerCase().split(/\W+/).filter(term => term.length > 1);
};

/*
Brief: TF-IDF (Term Frequency-Inverse Document Frequency)

The standard TF-IDF alone fails for:
- Short queries
- Queries where all terms are stop words — tokenize() returns [] so every note scores 0

Solution: I asked ChatGPT to recommend a solution to adjust for these queries while still wanting to leverage TF-IDF for its content scoring benefits.

To fix score adjustments are made post TF-IDF calculation based on the following factors:
1) If tokenizing the query yields no terms (all stop words), fall back to raw tokenization
2) After TF-IDF scoring, apply additive bonuses:
    +10 if the note title exactly matches the query
    +5  if the note title contains the query
    +2  if the note content contains the query

This ensures short or stop word containing queries still display relevant notes.

@Param1: userQuery - The raw search string from the user.
@Param2: notes - Array of note objects with title and content fields.

@Return: Array of note objects sorted by score descending, each with a score property added.
*/
const tfidfSearch = (userQuery, notes) => {
    let queryTerms = tokenise(userQuery);

    // Fallback if all query words were stop words, use raw tokens
    const usingFallback = queryTerms.length === 0;

    if (usingFallback) {
        queryTerms = tokeniseRaw(userQuery);
    }

    // If still nothing (e.g. query was just punctuation), return notes as-is with score 0
    if (queryTerms.length === 0) {
        return notes.map(note => ({ ...note, score: 0 }));
    }

    const queryTermCounts = {};
    queryTerms.forEach(term => {
        queryTermCounts[term] = (queryTermCounts[term] || 0) + 1;
    });

    const normalisedQuery = userQuery.toLowerCase().trim();

    const noteScores = notes.map(note => {
        const noteText = note.title + ' ' + note.content;
        const noteTerms = usingFallback ? tokeniseRaw(noteText) : tokenise(noteText);
        const noteTermCounts = {};

        noteTerms.forEach(term => {
            noteTermCounts[term] = (noteTermCounts[term] || 0) + 1;
        });

        // TF-IDF score across all query terms
        let score = 0;
        for (const term in queryTermCounts) {
            const tf = noteTermCounts[term] || 0;
            const docsWithTerm = notes.filter(n => 
            {
                let terms = "";
                
                if (usingFallback) 
                    terms = tokeniseRaw(n.title + ' ' + n.content);
                else
                    terms = tokenise(n.title + ' ' + n.content);

                return terms.includes(term);

            }).length;
            const idf = Math.log((notes.length + 1) / (1 + docsWithTerm)); // +1 smoothing prevents log(0)
            score += tf * idf;
        }

        // Substring bonuses — ensures exact/partial title matches always surface
        const normalisedTitle = note.title.toLowerCase().trim();
        const normalisedContent = note.content.toLowerCase();

        if (normalisedTitle === normalisedQuery) score += 10;
        else if (normalisedTitle.includes(normalisedQuery)) score += 5;
        
        if (normalisedContent.includes(normalisedQuery)) score += 2;

        return { ...note, score };
    });

    return noteScores.sort((a, b) => b.score - a.score); // Sort descending by score
};

export default tfidfSearch;
export { tokenise as tokenize };