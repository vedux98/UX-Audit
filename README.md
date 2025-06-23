# UX Audit - Figma Plugin

A comprehensive UX/UI audit plugin for Figma that performs accessibility checks, heuristic evaluations, and basic website audits.

## Features

### Frame Audit
- **Accessibility Checks**: Color contrast analysis, text size validation, touch target size verification
- **Heuristic Evaluation**: Nielsen's 10 heuristics including consistency, system status visibility, user control, and more
- **Visual Analysis**: Color palette and typography consistency checks

### Website Audit (Basic)
- Basic accessibility and UX scoring
- No external API dependencies required
- Ready for future enhancement with user-provided API keys

## Architecture

This plugin uses a **client-side only** approach, making it:
- ✅ Easy to deploy and distribute
- ✅ No server costs or maintenance
- ✅ Works immediately for all users
- ✅ No user data storage concerns

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Load the plugin in Figma using the `manifest.json` file

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes
npm run watch
```

## Extending the Plugin

### Adding External APIs
If you want to add external services (like Google PageSpeed Insights), you can:

1. **Client-side approach**: Ask users to provide their own API keys
2. **Backend approach**: Set up your own serverless function (Vercel, Netlify, etc.)

### Example: Adding Google PageSpeed API
```typescript
// In code.ts, modify the performBasicWebsiteAudit function
async function performBasicWebsiteAudit(url: string, apiKey?: string) {
  if (apiKey) {
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=ACCESSIBILITY&category=SEO&key=${apiKey}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    // Process Lighthouse results...
  }
  // Fallback to basic checks...
}
```

## File Structure

```
UXAudit/
├── code.ts              # Main plugin logic
├── ui.html              # Plugin UI
├── manifest.json        # Plugin manifest
├── types.ts             # TypeScript type definitions
├── accessibility.ts     # Accessibility analysis (modular)
├── heuristics.ts        # Heuristic evaluation (modular)
├── lighthouse.ts        # Lighthouse API integration (modular)
├── frame-audit.ts       # Frame audit logic (modular)
├── website-audit.ts     # Website audit logic (modular)
├── utils.ts             # Utility functions
└── api/                 # Backend functions (optional)
    └── audit.ts         # Vercel serverless function
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.
