/**
 * Interactive Terminal Component for Abdulrahman Mohammed Eid
 * Terminal simulation with command parsing, history, quick buttons, and API responses
 */

(function () {
  const terminalBody = document.getElementById('terminal-body');
  const terminalInput = document.getElementById('terminal-input');
  const clearBtn = document.getElementById('term-clear-btn');
  const quickCmdBtns = document.querySelectorAll('.quick-cmd-btn');

  if (!terminalBody || !terminalInput) return;

  const commandHistory = [];
  let historyIndex = -1;

  const commands = {
    help: () => `
<div class="terminal-line output-info">Available commands:</div>
<div class="terminal-line">  <span class="output-cyan">bio</span>        - Print developer background summary</div>
<div class="terminal-line">  <span class="output-cyan">skills</span>     - List core backend proficiencies</div>
<div class="terminal-line">  <span class="output-cyan">projects</span>   - View featured backend projects</div>
<div class="terminal-line">  <span class="output-cyan">experience</span> - Check current teaching role at Afaq</div>
<div class="terminal-line">  <span class="output-cyan">education</span>  - View BIS degree details</div>
<div class="terminal-line">  <span class="output-cyan">contact</span>    - Print contact methods & social links</div>
<div class="terminal-line">  <span class="output-cyan">status</span>     - Check server health & architecture metrics</div>
<div class="terminal-line">  <span class="output-cyan">curl &lt;url&gt;</span>  - Simulate HTTP GET endpoint request</div>
<div class="terminal-line">  <span class="output-cyan">cv</span>           - Download PDF Curriculum Vitae</div>
<div class="terminal-line">  <span class="output-cyan">clear</span>      - Clear terminal screen</div>
`,
    cv: () => {
      const a = document.createElement('a');
      a.href = 'assets/cv/Abdulrahman_Mohammed_Eid_CV.pdf';
      a.download = 'Abdulrahman_Mohammed_Eid_CV.pdf';
      a.click();
      return `<div class="terminal-line output-success">✓ Initiated PDF Download: Abdulrahman_Mohammed_Eid_CV.pdf</div>`;
    },
    bio: () => `
<div class="terminal-line output-success">❯ Abdulrahman Mohammed Eid</div>
<div class="terminal-line output-info">Role: Backend Software Engineer | Node.js · TypeScript · NestJS (Graduated 2026)</div>
<div class="terminal-line">Experienced in architecting RESTful & GraphQL APIs, MongoDB, JWT/2FA security, Redis caching, and clean modular designs.</div>
<div class="terminal-line output-amber">★ Route Academy Backend Node.js Top Achiever</div>
`,
    skills: () => `
<div class="terminal-line output-cyan">==== CORE STACK ====</div>
<div class="terminal-line"><span class="output-success">Languages:</span> TypeScript, JavaScript (ES2024), SQL</div>
<div class="terminal-line"><span class="output-success">Frameworks:</span> NestJS, Express.js, Node.js</div>
<div class="terminal-line"><span class="output-success">Databases:</span> MongoDB (Mongoose ODM), SQL Server, ERD Design</div>
<div class="terminal-line"><span class="output-success">Security:</span> JWT, 2FA, RBAC Guards & Decorators, DTOs (class-validator)</div>
<div class="terminal-line"><span class="output-success">Cloud/DevOps:</span> Redis Cache, AWS, Cloudinary, Git, Postman</div>
`,
    projects: () => `
<div class="terminal-line output-cyan">==== FEATURED PROJECTS ====</div>
<div class="terminal-line">1. <span class="output-success">E-Commerce Backend:</span> NestJS, TypeScript, MongoDB, Cloudinary, JWT (Guards, DTOs)</div>
<div class="terminal-line">2. <span class="output-success">Social Media Backend:</span> Node.js, GraphQL, MongoDB (Custom Repo, TTL Expiry, Cascading Deletes)</div>
<div class="terminal-line">3. <span class="output-success">Wshwshny Anonymous Messaging:</span> Node.js, MongoDB, Redis, AWS, 2FA Auth</div>
<div class="terminal-line">4. <span class="output-success">Black Horse Car Garage:</span> ASP.NET Web Forms, SQL Server, Relational ERD</div>
<div class="terminal-line output-info">Tip: Scroll down to inspect interactive project schemas!</div>
`,
    experience: () => `
<div class="terminal-line output-success">❯ Afaq Academy for Artificial Intelligence</div>
<div class="terminal-line output-info">Role: Instructor (Aug 2026 – Present)</div>
<div class="terminal-line">• Delivering beginner-friendly lessons on AI concepts, pipelines, and developer tooling.</div>
<div class="terminal-line">• Structuring technical curriculum to simplify complex engineering topics for learners.</div>
`,
    education: () => `
<div class="terminal-line output-success">❯ Bachelor's Degree in Business Information Systems (BIS)</div>
<div class="terminal-line output-info">El Motatawera Higher Institute, Haram – Giza (Graduated 2026)</div>
<div class="terminal-line">• Focused on database architecture, system analysis, enterprise info systems & software modeling.</div>
`,
    contact: () => `
<div class="terminal-line output-cyan">==== CONTACT CHANNELS ====</div>
<div class="terminal-line">Email:    <a href="mailto:abdelrahman782eid@gmail.com" class="output-success">abdelrahman782eid@gmail.com</a></div>
<div class="terminal-line">Phone:    <span class="output-success">01063887051</span> (Egypt)</div>
<div class="terminal-line">GitHub:   <a href="https://github.com/abdelrahman228" target="_blank" class="output-cyan">github.com/abdelrahman228</a></div>
<div class="terminal-line">LinkedIn: <a href="https://linkedin.com/in/abdulrahman-mohammed-6015b620b" target="_blank" class="output-cyan">linkedin.com/in/abdulrahman-mohammed-6015b620b</a></div>
<div class="terminal-line">Location: Hadayek October, Giza, Egypt</div>
`,
    status: () => `
<div class="terminal-line output-success">● HTTP 200 OK - Cluster Healthy (Demo / Simulated)</div>
<div class="terminal-line">Runtime:     Node.js v20.18.0 (v8 engine)</div>
<div class="terminal-line">Framework:   NestJS v10.4.x / Express 4.x</div>
<div class="terminal-line">Database:    MongoDB Replica Set (Connected)</div>
<div class="terminal-line">Cache:       Redis 7.2 (PONG - 0.4ms)</div>
<div class="terminal-line">Memory:      42.8 MB / 512 MB RSS</div>
<div class="terminal-line">Latency:     12ms | Uptime: 99.99%</div>
`,
    clear: () => {
      // Clear all lines except input row
      const lines = terminalBody.querySelectorAll('.terminal-line');
      lines.forEach(l => l.remove());
      return null;
    }
  };

  function appendOutput(rawHtml) {
    if (!rawHtml) return;
    const div = document.createElement('div');
    div.innerHTML = rawHtml;
    // Insert before interactive row
    const interactiveRow = terminalBody.querySelector('.terminal-interactive-row');
    terminalBody.insertBefore(div, interactiveRow);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function handleCommand(cmdText) {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Append the command echo
    const echoLine = document.createElement('div');
    echoLine.className = 'terminal-line cmd-echo';
    echoLine.textContent = `$ ${trimmed}`;
    const interactiveRow = terminalBody.querySelector('.terminal-interactive-row');
    terminalBody.insertBefore(echoLine, interactiveRow);

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    if (mainCmd === 'clear') {
      commands.clear();
      return;
    }

    if (mainCmd === 'curl') {
      const responseHtml = `
<div class="terminal-line output-info">&gt; GET ${arg || '/api/v1/bio'} HTTP/1.1</div>
<div class="terminal-line output-success">&lt; HTTP/1.1 200 OK</div>
<div class="terminal-line output-info">&lt; Content-Type: application/json</div>
<div class="terminal-line json-block">{
  "status": "success",
  "data": {
    "name": "Abdulrahman Mohammed Eid",
    "role": "Backend Software Engineer",
    "specialties": ["Node.js", "TypeScript", "NestJS", "GraphQL", "MongoDB", "Redis"],
    "openToRoles": ["Junior Backend Engineer", "Backend Engineering Intern"],
    "location": "Giza, Egypt"
  }
}</div>`;
      appendOutput(responseHtml);
      return;
    }

    if (mainCmd === 'cat') {
      if (arg.includes('bio') || arg.includes('resume')) {
        const jsonHtml = `
<div class="terminal-line json-block">{
  "engineer": "Abdulrahman Mohammed Eid",
  "title": "Backend Software Engineer",
  "education": "BIS - El Motatawera Higher Institute (Graduated 2026)",
  "distinction": "Route Academy Backend Node.js Top Achiever",
  "teaching": "Instructor @ Afaq Academy for Artificial Intelligence"
}</div>`;
        appendOutput(jsonHtml);
      } else {
        appendOutput(`<div class="terminal-line output-amber">cat: ${arg || 'file'}: No such file or directory. Try 'cat bio.json'</div>`);
      }
      return;
    }

    if (commands[mainCmd]) {
      appendOutput(commands[mainCmd]());
    } else {
      appendOutput(`
<div class="terminal-line output-amber">zsh: command not found: ${trimmed}</div>
<div class="terminal-line output-info">Type <span class="output-cyan">'help'</span> for available backend commands.</div>
`);
    }
  }

  terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const val = terminalInput.value;
      terminalInput.value = '';
      handleCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => commands.clear());
  }

  // Quick Command Buttons
  quickCmdBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) {
        terminalInput.value = cmd;
        handleCommand(cmd);
        terminalInput.focus();
      }
    });
  });

  // Keep focus when clicking inside terminal
  terminalBody.addEventListener('click', () => {
    terminalInput.focus();
  });
})();
