import ResultCard from './ResultCard'

function ResultsList({ results, onSelect, onDirectionsClick, onSimilarClick, onMenuClick }) {
    if (!results || results.length === 0) {
        return null
    }

    return (
        <div className="results-grid">
            {results.map((result) => (
                <ResultCard
                    key={result.id}
                    result={result}
                    onDirectionsClick={onDirectionsClick}
                    onSimilarClick={onSimilarClick}
                    onMenuClick={onMenuClick}
                />
            ))}
        </div>
    )
}

export default ResultsList


