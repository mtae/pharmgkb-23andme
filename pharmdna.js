var addCellToRow = function(row, value) {
    var newCell = document.createElement("td");
    var text = document.createTextNode(value);
    newCell.appendChild(text);
    row.appendChild(newCell);
};

var parse23AndMe = function(contents) {
    var lines = contents.replace(/^#.*/gm, "").replace("\r", "").split("\n").map(function(line) { return line.split("\t"); });
    var rsidToGenotype = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Ignore empty lines
        if (line.length > 1) {
            rsidToGenotype[line[0]] = line[3].replace(/\W/g, "");
        }  
    }

    return rsidToGenotype;
}

var onTableLoad = function(table) {
    var rows = table.querySelectorAll("tr");
    var header = rows[0];

    // Add an upload button to add genetic data
    var tableConfigContainer = document.querySelector(".table-config > div");
    var uploadButton = document.createElement("input");
    uploadButton.setAttribute("type", "file");
    var flexSpace = tableConfigContainer.querySelector(".flex-space");
    tableConfigContainer.insertBefore(uploadButton, flexSpace);

    var showResults = function(rsidToGenotype) {
        //addCellToRow(row[0], "Your genotype");
        //addCellToRow(row[1], "");

        for (var i = 2; i < rows.length; i++) {
            var row = rows[i];
            var rsidList = row.querySelector("td .comma-list").children;
            rsidLinksList = Array.prototype.slice.call(rsidList).map(function (span) { return span.querySelector("a"); });
            var genotypes = rsidLinksList.map(function (rsidLink) {
                var rsid = rsidLink.innerText;
                if (rsid in rsidToGenotype)  {
                    return rsidToGenotype[rsid];
                } else {
                    return "N/A"
                }});
            addCellToRow(row, genotypes.join(","));
        }
    };

    var onUpload = function(e1) {
        var r = new FileReader();
        r.onload = function(e2) {
            var contents = e2.target.result;
            var rsidToGenotype = parse23AndMe(contents);
            showResults(rsidToGenotype);
            browser.storage.local.set({"rsidToGenotype": rsidToGenotype});
        };
        r.readAsText(e1.target.files[0]);
    };
    uploadButton.addEventListener("input", onUpload, false);

    var storagePromise = browser.storage.local.get("rsidToGenotype");
    storagePromise.then(function(data) { showResults(data.rsidToGenotype); }, console.log);
};

var tableChecker = setInterval(function() {
    var table = document.querySelector(".variant-annotation-set table");
    if (table !== null) {
        clearInterval(tableChecker);
        onTableLoad(table);
    }
}, 100);