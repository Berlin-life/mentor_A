// Basic Jaccard Similarity Implementation
// Jaccard Index = (Intersection of sets) / (Union of sets)

const calculateSimilarity = (userA, userB) => {
    // Combine skills and interests for matching
    const tagsA = new Set([...userA.skills, ...userA.interests].map(t => t.toLowerCase()));
    const tagsB = new Set([...userB.skills, ...userB.interests].map(t => t.toLowerCase()));

    if (tagsA.size === 0 || tagsB.size === 0) return 0;

    const intersection = new Set([...tagsA].filter(x => tagsB.has(x)));
    const union = new Set([...tagsA, ...tagsB]);

    return intersection.size / union.size;
};

const getRecommendations = (currentUser, candidates) => {
    return candidates
        .map(candidate => ({
            user: candidate,
            score: calculateSimilarity(currentUser, candidate)
        }))
        .sort((a, b) => b.score - a.score); // Sort by highest score
};

module.exports = { calculateSimilarity, getRecommendations };
