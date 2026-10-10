
// @ts-ignore
import nlp from 'compromise';

export const generateSmartTags = (htmlContent: string): string[] => {
    try {
        // 1. Strip HTML to get raw text
        const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
        const text = doc.body.textContent || "";

        console.log("SmartTags: Analyzing text length:", text.length);

        // Lower threshold to allow short quick entries
        if (text.length < 3) return [];

        const rawTags: string[] = [];

        // 2. Hashtag Extraction (e.g. #Travel, #Food)
        // This allows users to explicitly tag within the text
        const hashtagRegex = /#(\w+)/g;
        let match;
        while ((match = hashtagRegex.exec(text)) !== null) {
            if (match[1].length > 1) {
                rawTags.push(match[1]);
            }
        }

        // 3. NLP Extraction
        if (nlp) {
            const docNlp = nlp(text);
            
            // Get specific entities
            const topics = docNlp.topics().out('array');
            const places = docNlp.places().out('array');
            const people = docNlp.people().out('array');
            const organizations = docNlp.organizations().out('array');
            
            // "ProperNoun" catches capitalized words that might not be famous enough to be a "Topic"
            // This makes it much more responsive for personal things like "Dad", "Rover", "Main Street".
            const properNouns = docNlp.match('#ProperNoun').out('array');

            rawTags.push(...topics, ...places, ...people, ...organizations, ...properNouns);
        } else {
             console.warn("SmartTags: 'compromise' library not loaded. Only hashtags will work.");
        }

        // 4. Clean and Normalize
        const cleanedTags = rawTags
            .map((tag: string) => tag.trim())
            // Remove punctuation from start/end
            .map((tag: string) => tag.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
            .filter((tag: string) => tag.length > 2) // Filter out tiny noise
            // Convert to Title Case (e.g. "paris" -> "Paris")
            .map((tag: string) => 
                tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
            );

        // 5. Deduplicate
        const uniqueTags = Array.from(new Set(cleanedTags));
        
        console.log("SmartTags: Suggestions found:", uniqueTags);
        return uniqueTags;

    } catch (err) {
        console.error("SmartTags: Error generating tags", err);
        return [];
    }
};
