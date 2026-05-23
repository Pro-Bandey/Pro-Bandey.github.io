/**
 * Landing Page Interactive Typing Simulation Engine
 */
document.addEventListener("DOMContentLoaded", () => {
    const terminalBody = document.getElementById("terminal-body");
    if (!terminalBody) return;

    // Command array with simulated outputs
    const consoleCommands = [
        { cmd: "check_sys --status", output: ["Platform: GitHub Pages Workspace", "Node.js Environment: v20.x active", "Security Handshake: Successful"] },
        { cmd: "get_specialties", output: ["- Web App Engineering (PWA)", "- Continuous Integration Pipelines", "- Dynamic API Implementations"] },
        { cmd: "ready_state", output: ["System loaded. Ready for pipeline connections."] }
    ];

    let currentCommandIndex = 0;

    function appendLine(text, isPromptLine = false, customClass = "") {
        const line = document.createElement("div");
        line.className = `line ${customClass}`;
        if (isPromptLine) {
            line.innerHTML = `<span class="terminal-prompt">$</span> ${text}`;
        } else {
            line.textContent = text;
        }
        terminalBody.appendChild(line);
        
        // Auto-scroll the terminal panel down
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function simulateTyping(commandObj) {
        let text = commandObj.cmd;
        let index = 0;
        
        // Append prompt line container to write characters slowly
        const promptLine = document.createElement("div");
        promptLine.className = "line";
        promptLine.innerHTML = `<span class="terminal-prompt">$</span> `;
        const charSpan = document.createElement("span");
        promptLine.appendChild(charSpan);
        terminalBody.appendChild(promptLine);

        function typeChar() {
            if (index < text.length) {
                charSpan.textContent += text.charAt(index);
                index++;
                setTimeout(typeChar, 75); // Typing speed configuration (75ms/char)
            } else {
                // Command finished typing, render its response output array after delay
                setTimeout(() => {
                    commandObj.output.forEach(outText => {
                        appendLine(outText, false, "text-muted");
                    });
                    currentCommandIndex++;
                    
                    // Proceed to output the next block after a delayed period
                    if (currentCommandIndex < consoleCommands.length) {
                        setTimeout(() => simulateTyping(consoleCommands[currentCommandIndex]), 1500);
                    }
                }, 400);
            }
        }

        typeChar();
    }

    // Trigger simulation 1.2 seconds after core scripts are initialized
    setTimeout(() => {
        simulateTyping(consoleCommands[0]);
    }, 1200);
});