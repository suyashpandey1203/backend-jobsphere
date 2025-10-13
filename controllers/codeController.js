const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

// Helper to execute code for different languages
const runCodeByLanguage = (code, language, input) => {
  return new Promise((resolve) => {
    const timestamp = Date.now();
    let filename, command;

    switch (language) {
      case "python":
        filename = path.join(__dirname, `temp_${timestamp}.py`);
        fs.writeFileSync(filename, code);
        command = `python "${filename}"`;
        break;

      case "javascript":
        filename = path.join(__dirname, `temp_${timestamp}.js`);
        fs.writeFileSync(filename, code);
        command = `node "${filename}"`;
        break;

      case "cpp":
        filename = path.join(__dirname, `temp_${timestamp}.cpp`);
        const exeFile = path.join(__dirname, `temp_${timestamp}.out`);
        fs.writeFileSync(filename, code);
        // compile and run in one command
        command = `g++ "${filename}" -o "${exeFile}" && "${exeFile}"`;
        break;

      case "java":
        filename = path.join(__dirname, `Temp${timestamp}.java`);
        const className = `Temp${timestamp}`;
        code = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
        fs.writeFileSync(filename, code);
        command = `javac "${filename}" && java -cp "${__dirname}" ${className}`;
        break;

      default:
        return resolve({ error: `Language ${language} not supported` });
    }

    const child = exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      // Cleanup temp files
      try { fs.unlinkSync(filename); } catch {}
      if (language === "cpp") {
        try { fs.unlinkSync(exeFile); } catch {}
      }
      if (language === "java") {
        try { fs.unlinkSync(path.join(__dirname, `${className}.class`)); } catch {}
      }

      // Send both stdout and stderr
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), error: error ? error.message : null });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
};


// Controller
exports.runCode = async (req, res) => {
  const { code, language, input } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const result = await runCodeByLanguage(code, language, input);
    console.log(result)
    res.json({
      success: !result.error && !result.stderr, // true if no runtime/compile error
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
    });
  } catch (err) {
    res.json({
      success: false,
      stdout: "",
      stderr: err.toString(),
    });
  }
};
