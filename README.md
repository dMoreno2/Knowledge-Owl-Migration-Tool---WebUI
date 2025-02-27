# Knowledge-Owl-Migration-Tool-WebUI

The **Knowledge Owl Migration Tool** is designed to help migrate articles from your **Knowledge Owl** knowledge base to a new platform.  

By default, this tool facilitates migrations from **Knowledge Owl to Intercom**, allowing you to create and update articles in Intercom. However, with minor modifications, it can be adapted to:  
- Migrate articles from **Intercom to Knowledge Owl**  
- Migrate articles between other knowledge bases  

## Features:
- **Web-based UI**: The tool runs a **Node.js HTTP server**, making the migration process accessible via a web interface on your **local network**.  
- **Remote Access**: With port forwarding, you can access the tool externally.  

---

## Setup Instructions:

### 1. Install Node.js  
   - [Download and install Node.js](https://nodejs.org/).  

### 2. Clone this repository  
   - Open a terminal and run:  
     ```sh
     git clone https://github.com/dMoreno2/Knowledge-Owl-Migration-Tool-WebUI.git
     cd Knowledge-Owl-Migration-Tool-WebUI
     ```

### 3. Configure the tool  
   - Open the **config template** and enter your details.  
   - Rename the file to remove "template" from its name.  

### 4. (Optional) Enable Test Mode  
   The tool supports a separate test configuration for test environment API credentials.  

   - Open the **`Migration Tool.js`** file and find the `TESTMODE` variable:  
     ```js
     var TESTMODE = false;
     ```
   - Change its value to `true`:
     ```js
     var TESTMODE = true;
     ```
   - Create a copy of the **config template** and enter your test details.  
   - Rename this file to **"testconfig.json"** (alongside your main **"config.json"** file).  

### 5. Start the Server  
   - Run the following command:  
     ```sh
     Start Server.bat
     ```
   - This will launch the web interface on your local network.  

---

## Notes:
- Ensure your API credentials are correct before running the migration.  
- If modifying the tool for other knowledge bases, you may need to adjust the value mappings for articles/API responses in **`Migration Tool.js`**.  
- This program is still in **BETA**, so you may encounter bugs or errors. Please report any issues to help improve the tool.  

---

Let me know if you need further tweaks! 🚀  
