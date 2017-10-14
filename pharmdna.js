(function() {
    var processedLinks = new WeakSet();

    var showResults = function(rsidToGenotype) {
        var snpLinks = document.querySelectorAll("a");
        for (var i = 0; i < snpLinks.length; i++) {
            var link = snpLinks[i];
            if (!processedLinks.has(link)) {
                processedLinks.add(link);
                var snpName = link.innerText;
                if (snpName in rsidToGenotype) {
                    link.innerText += "(" + rsidToGenotype[snpName] + ")";
                }
            }
        }
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

    var intervalHandle = null;

    var intervalRun = function() {
        if (intervalHandle != null) {
            clearInterval(intervalHandle);
        }

        var storagePromise = browser.storage.local.get("rsidToGenotype");
        storagePromise.then(function(data) {
            var rsidToGenotype = JSON.parse(data.rsidToGenotype);
            intervalHandle = setInterval(function() {
                showResults(rsidToGenotype);
            }, 1000);
        }, function() {});
    };

    var resourceContent = new WeakSet();
    setInterval(function() {
        // Add an upload button to add genetic data
        var content = document.querySelector(".resource-content");
        if (!resourceContent.has(content)) {
            resourceContent.add(content);
            var div = document.createElement("div");
            var title = document.createElement("h3");
            title.innerText = "23andMe Data";
            var clearLink = document.createElement("a");
            clearLink.innerText = "Clear saved data";
            var uploadButton = document.createElement("input");
            uploadButton.setAttribute("type", "file");
            div.appendChild(title);
            div.appendChild(uploadButton);
            div.appendChild(clearLink);
            content.insertBefore(div, content.children[0]);

            clearLink.addEventListener('click', function() {
                browser.storage.local.remove("rsidToGenotype");
                alert("Genetic data has been cleared");
            });
        
            var onUpload = function(e1) {
                var r = new FileReader();
                r.onload = function(e2) {
                    var contents = e2.target.result;
                    var rsidToGenotype = parse23AndMe(contents);
                    browser.storage.local.set({"rsidToGenotype": JSON.stringify(rsidToGenotype)});
                    showResults(rsidToGenotype);
                    intervalRun();
                };
                r.readAsText(e1.target.files[0]);
            };
            uploadButton.addEventListener("input", onUpload, false);
        }
    }, 1000);

    intervalRun();
})();