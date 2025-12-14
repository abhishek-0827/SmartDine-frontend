function ChatInput({ value, onChange, onSubmit, disabled }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit(value)
        }
    }

    const handleSubmit = () => {
        onSubmit(value)
    }

    return (
        <div className="chat-input">
            <input
                type="text"
                placeholder="e.g., I want spicy Italian food nearby..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
            />
            <button onClick={handleSubmit} disabled={disabled || !value.trim()}>
                Search
            </button>
        </div>
    )
}

export default ChatInput
