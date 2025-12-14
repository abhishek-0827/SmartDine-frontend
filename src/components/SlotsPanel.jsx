function SlotsPanel({ slots }) {
    return (
        <div className="slots-panel">
            <h3>Extracted Slots</h3>
            <pre>{JSON.stringify(slots, null, 2)}</pre>
        </div>
    )
}

export default SlotsPanel
