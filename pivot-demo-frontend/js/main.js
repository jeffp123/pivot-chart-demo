var PivotDataModel = Backbone.Model.extend({
    urlRoot: "/results",
    getQuestion: function(questionId) {
        if (questionId == "QS6_6") {
            return "QS6_6: Where do you use each of the following services? (- Send a money transfer to a friend or family member -)";
        }
        else if (questionId == "Q30b") {
            return "Q30b: Do any of the payment cards that you own allow you to use it without swiping it in a terminal by waving it in front of a reader to indicate a transaction if the store was equipped with the proper reader? Credit, charge, or debit cards like these are referred to as contactless cards and typically contain a symbol like the image below on the face of the card.";
        }
        else if (questionId == "Q31_1") {
            return "Q31_1: Which Payment method do you prefer to use for online purchases for the following categories [Online Retailer (Shipped)]";
        }
    },
    getPivotQuery: function (questionId) {
        var filters = {
            "01::Total": { "match_all": {} },
            "02:Gender:Male": { "match": { "gender": "F" } },
            "03:Gender:Female": { "match": { "gender": "M" } },
            "04:Age:18 to 34":  { "range": { "age":  {"from" : "18", "to" : "34"} } },
            "05:Age:35 to 64":  { "range": { "age":  {"from" : "35", "to" : "64"} } },
            "06:Age:65 or Older":  { "range": { "age":  {"from" : "65"} } },
            "07:Household Income:Less than $50K":  { "range": { "household_income":  {"to" : "50"} } },
            "08:Household Income:$50K to $75K":  { "range": { "household_income":  {"from" : "50", "to" : "75"} } },
            "09:Household Income:$75K to $100K":  { "range": { "household_income":  {"from" : "75", "to" : "100"} } },
            "10:Household Income:$100K or more":  { "range": { "household_income":  {"from" : "100"} } }
        };
    
        var query = {
            query: { match_all:{} }, 
            aggs: {}
        };
    
        for (var filterTitle in filters) {
            var filter = filters[filterTitle];
        
            query.aggs[filterTitle] = {
                filter:filter,
                aggs: { answers: { terms: { field: questionId } } }
            };
        }
    
        return JSON.stringify(query);
    },
    updateResults: function(questionId) {
        var query = this.getPivotQuery(questionId);
        var question = this.getQuestion(questionId);
    
        this.fetch({
            data:{query:query},
            success: function(model, response, options) {
                var aggregations = response.res.aggregations;
            
                var titleSpans = {};
                var subtitleSpans = {};
                var titles = [];
                var subtitles = [];
                var entries = {};
                var bgColorIds = [];
            
                var currBgColorId = -1;
            
                for (var fullTitle in aggregations) {
                    var aggBuckets = aggregations[fullTitle].answers.buckets;
                
                    var res = fullTitle.split(':');
                    var title = res[1];
                    var subtitle = res[2];
                
                    for (var i in aggBuckets) {
                        var bucket = aggBuckets[i];
                    
                        if (!subtitleSpans[subtitle]) {
                            subtitleSpans[subtitle] = 1;
                            subtitles.push(subtitle);
                        
                        
                            if (titleSpans[title]) {
                                titleSpans[title]++;
                            }
                            else {
                                titleSpans[title] = 1;
                                titles.push(title);
                                
                                currBgColorId++;
                            }
                            
                            bgColorIds.push(currBgColorId);
                        }
                    
                        if (!entries[bucket.key]) {
                            entries[bucket.key] = [];
                        }
                    
                        entries[bucket.key].push({count:bucket.doc_count});
                    }
                }
                
                //model.clear({silent:true});
                
                model.set({
                    question:question,
                    titles:titles,
                    titleSpans:titleSpans,
                    subtitles:subtitles,
                    entries:entries,
                    bgColorIds:bgColorIds
                });
            },
            error: function(model, response, options) {
                alert("ERROR: " + response);
            }
        });
    }
});

var SingleQuestionTableView = Backbone.View.extend({
    totalDocCount: 100000,

    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        var question = this.model.get("question");
        var titles = this.model.get("titles");
        var titleSpans = this.model.get("titleSpans");
        var subtitles = this.model.get("subtitles");
        var entries = this.model.get("entries");
        var bgColorIds = this.model.get("bgColorIds");
        
        var template = Handlebars.compile($("#pivot-table-tpl").html());

        for (var i in titles) {
            var title = titles[i];
            titles[i] = { title:title, span:titleSpans[title], bgColorId:i }
        }
        
        for (var i in subtitles) {
            var subtitle = subtitles[i];
            subtitles[i] = { subtitle:subtitle, bgColorId:bgColorIds[i] }
        }
        
        var countData = [];
        
        for (var answer in entries) {
            for (var i in entries[answer]) {
                var count = parseInt(entries[answer][i].count);
                
                if (!countData[i]) {
                    countData[i] = [];
                }
                
                countData[i].push({
                    "x": answer,
                    "y": count
                });
                
                entries[answer][i].percentage = (100 * count / this.totalDocCount).toFixed(1);
                entries[answer][i].bgColorId = bgColorIds[i];
            }
        }
    
        var html = template({
            question:question,
            titles:titles,
            titleSpans:titleSpans,
            subtitles:subtitles,
            entries:entries
        });
        
        this.$el.html(html);
        
        var data = {
          "xScale": "ordinal",
          "yScale": "linear",
          "main": []
        };
        
        for (var i in countData) {
            data.main.push({
              "className": ".bar-chart-"+i,
              "data": countData[i]
            });
        }
    }
});

var TableView = Backbone.View.extend({
    singleQuestionTableView: null,
    questionId: null,

    initialize: function() {
        this.pivotTableModel = new PivotDataModel();
        
        this.questionId = "QS6_6"; // Default starting question
        
        this.render();
    },
    render: function() {
        var template = Handlebars.compile($("#table-tpl").html());
        
        var html = template();
        
        this.$el.html(html);
        
        if (this.singleQuestionTableView == null) {
            this.singleQuestionTableView = new SingleQuestionTableView({ el: $("#pivot-table"), model:this.pivotTableModel });
        }
        
        this.updateResults();
    },
    updateResults: function() {
        this.pivotTableModel.updateResults(this.questionId);
    },
    events: {
        "click .question-select":"doQuestionSelect"
    },
    doQuestionSelect: function (e) {
        var select = $(e.currentTarget).data("select");
        
        this.questionId = this.getQuestionId(this.questionId, select);
        
        this.updateResults();
    },
    getQuestionId:function (currentQuestionId, select) {
        var questionIds = ["QS6_6", "Q30b", "Q31_1"];
    
        var idx = _.indexOf(questionIds, currentQuestionId);
    
        if (select == "prev") {
            idx--;
        
            if (idx < 0) {
                idx = questionIds.length - 1;
            }
        }
        else if (select == "next") {
            idx++;
        
            if (idx > questionIds.length - 1) {
                idx = 0;
            }
        }
    
        return questionIds[idx];
    }
});

var SearchView = Backbone.View.extend({
    initialize: function(){
        this.render();
    },
    render: function(){
        var template = Handlebars.compile($("#search-tpl").html());
        
        var html = template();
        
        this.$el.html(html);
    },
    events: {
        "click button[id=submit-button]": "doSearch",
        "click a[id=populate-sample-query]": "doPopulateSampleQuery"
    },
    doSearch: function(e) {
        e.preventDefault();
        
        var query = $("#query-input").val();
        
        Backbone.history.navigate("search/"+encodeURIComponent(query));
        
        $("#submit-button").attr("disabled", "disabled");
        
        $.get("/results", {query:query}, function(data) {
            var tokensTemplate = $('#tokens-tpl').html();
        
            $("#results").empty();
        
            //$("#results").append("<h2>Original Query:</h2><p>"+data.res.original+"</p>")
        
            var queryTimeMiliSec = data["total-time"] * 1000;
        
            $("#results").append("<h2>Total Query Time</h2><p>"+queryTimeMiliSec.toFixed(3)+"ms</p>");
        
            $("#results").append("<h2>Raw Results</h2><pre>"+JSON.stringify(data, null, '\t')+"</pre>");
        
            $("#results-div").removeClass('hidden');
            $("#submit-button").removeAttr("disabled");
        }).fail( function() {
            console.log("ERROR");
            
            $("#results").empty();
            
            $("#results").append("ERROR");
            
            $("#results-div").removeClass('hidden');
            $("#submit-button").removeAttr("disabled");
        });
    },
    doPopulateSampleQuery: function(e) {
        e.preventDefault();
        
        var sampleQuery = Handlebars.compile($("#sample-query-tpl").html())();
        
        $("#query-input").val(sampleQuery);
    }
});

var FiltersView = Backbone.View.extend({
    questionIds: ["QS6_6", "Q30b", "Q31_1"],

    initialize: function(){
        this.render();
        
        this.on('trigger_update', this.doUpdateResult);
    },
    render: function(){
        var questions = [];
    
        for (var i in this.questionIds) {
            var questionId = this.questionIds[i];
            var question = this.getQuestion(questionId);
            questions.push({questionId:questionId, question:question, questionPreview:question.slice(0,30) + "..."});
        }
    
        var template = Handlebars.compile($("#filters-tpl").html());
        
        console.log(questions);
        
        var html = template({questions:questions});
        
        this.$el.html(html);
        
        $('.slider').slider();
    },
    events: {
        "change input": "doUpdateResult",
        "change select": "doUpdateResult",
        "slide input":"doUpdateSlider",
    },
    doUpdateSlider: function( e ) {
        var sliderElem = $(e.currentTarget);
        var sliderValue = sliderElem.slider('getValue');
        var sliderName = sliderElem.data("name");
        
        if (sliderName == "age") {
            $("#age-text").html(sliderValue[0] + " to " + sliderValue[1]);
            $("#min-age-input").val(sliderValue[0]);
            $("#max-age-input").val(sliderValue[1]);
        }
        else if (sliderName == "income") {
            $("#income-text").html("$" + sliderValue[0] + "K to $" + sliderValue[1] + "K");
            $("#min-income-input").val(sliderValue[0]);
            $("#max-income-input").val(sliderValue[1]);
        }
    },
    getFilteredQuery: function(minAge, maxAge, minIncome, maxIncome, genderFemale, genderMale, questionId) {
        var filter = {};
        
        console.log(minIncome);
    
        if (minAge || maxAge || minIncome || maxIncome || ( ( genderFemale && !genderMale ) || ( !genderFemale && genderMale ) ) ) {
            filter["and"] = [];
    
            if (minAge || maxAge) {
                var age = {};
        
                if (minAge) {
                    age["from"] = minAge;
                }
        
                if (maxAge) {
                    age["to"] = maxAge;
                }
        
                filter["and"].push({range: {age: age}});
            }
            
            if (minIncome || maxIncome) {
                var income = {};
        
                if (minIncome) {
                    income["from"] = minIncome;
                }
        
                if (maxIncome) {
                    income["to"] = maxIncome;
                }
        
                filter["and"].push({range: {household_income: income}});
            }
    
            if (genderFemale && !genderMale) {
                filter["and"].push({match: {gender: "F"}});
            }
            else if (genderMale && !genderFemale) {
                filter["and"].push({match: {gender: "M"}});
            }
        }
    
        query = {query:{filtered:{filter:filter}}, aggregations:{answers:{terms:{field:questionId}}}}
    
        return JSON.stringify(query)
    },
    doUpdateResult: function(e){
        e.preventDefault();
        
        var minAge = this.$("#min-age-input").val();
        var maxAge = this.$("#max-age-input").val();
        var genderMale = this.$("#gender-checkboxes-0:checked").val() == "M";
        var genderFemale = this.$("#gender-checkboxes-1:checked").val() == "F";
        var minIncome = this.$("#min-income-input").val();
        var maxIncome = this.$("#max-income-input").val();
        var questionId = this.$("#question-id-select").val();
        
        console.log(questionId);
        
        var query = this.getFilteredQuery(minAge, maxAge, minIncome, maxIncome, genderFemale, genderMale, questionId);
        
        $.get("/results", {query:query}, function(data) {
            var aggBuckets = data.res.aggregations.answers.buckets;
            var countData = [];
            var totalCount = 0;
            
            for (var i in aggBuckets) {
                var entry = aggBuckets[i];
            
                countData.push({
                    "x": entry.key,
                    "y": entry.doc_count
                });
                
                totalCount += entry.doc_count;
            }
            
            var data = {
              "xScale": "ordinal",
              "yScale": "linear",
              "main": [
                {
                  "className": ".bar-chart",
                  "data": countData
                }
              ]
            };
            
            var myChart = new xChart('bar', data, '#filters-chart');
            
            $("#filters-total").html("<p>Total Count: " + totalCount + "</p>");
            
            
        });
      
        return false;
    },
    getQuestion: function(questionId) {
        if (questionId == "QS6_6") {
            return "QS6_6: Where do you use each of the following services? (- Send a money transfer to a friend or family member -)";
        }
        else if (questionId == "Q30b") {
            return "Q30b: Do any of the payment cards that you own allow you to use it without swiping it in a terminal by waving it in front of a reader to indicate a transaction if the store was equipped with the proper reader? Credit, charge, or debit cards like these are referred to as contactless cards and typically contain a symbol like the image below on the face of the card.";
        }
        else if (questionId == "Q31_1") {
            return "Q31_1: Which Payment method do you prefer to use for online purchases for the following categories [Online Retailer (Shipped)]";
        }
    }
});


var MainView = Backbone.View.extend({
    initialize: function(){
        this.render();
    },
    render: function(){
        var template = Handlebars.compile($("#main-tpl").html());
        
        var html = template();
        
        this.$el.html(html);
    },
    events: {
        "click a[class=select-mode]": "doSelectMode"
    },
    doSelectMode: function(e) {
        e.preventDefault();
    
        var mode = $(e.currentTarget).data("mode");
        
        Backbone.history.navigate(mode, true);
    }
});



var AppRouter = Backbone.Router.extend({
    main: null,
    tableView: null,
    searchView: null,
    filtersView: null,
    graphsView: null,
    
    initialize: function() {
        this.main = new MainView({ el: $("#main-view")});
    },
    
    routes: {
        "table":"handleTable",
        "search":"handleSearch",
        "search/:query":"handleSearch",
        "filters":"handleFilters",
        "*actions":"handleDefault" // default
    },
    
    handleDefault: function() {
        this.navigate("table", true);
    },
    
    handleTable: function() {
        this._hideAllContentDivs();
    
        if (this.tableView == null) {
            this.tableView = new TableView({ el: $("#table-view") });
        }
        
        this.tableView.$el.show();
    },
    
    handleSearch: function(query) {
    
        this._hideAllContentDivs();
    
        if (this.searchView == null) {
            this.searchView = new SearchView({ el: $("#search-view") });
        }
        
        $("#query-input").val(query);
        
        this.searchView.$el.show();
    },
    
    handleFilters: function() {
        
        this._hideAllContentDivs();
        
        if (this.filtersView == null) {
            this.filtersView = new FiltersView({ el: $("#filters-view") });
        }
        
        this.filtersView.$el.find("input").first().trigger("change")
        
        this.filtersView.$el.show();
    },
    
    _hideAllContentDivs: function() {
        $("#content").children("div").hide();
    }
    
});

$(document).ready(function () {
    router = new AppRouter();
    Backbone.history.start({pushState:true});
})

