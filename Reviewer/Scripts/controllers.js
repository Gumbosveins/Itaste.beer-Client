'use strict';

// Google Analytics Collection APIs Reference:
// https://developers.google.com/analytics/devguides/collection/analyticsjs/

angular.module('app.controllers', [])

    // Path: /
    .controller('HomeCtrl', ['$scope', '$location', '$window', '$state', 'beerService', function ($scope, $location, $window, $state, beerService) {
        
        if(localStorage.getItem("userId") != null
        && localStorage.getItem("roomCode") != null
        && localStorage.getItem("pin") != null
        && localStorage.getItem("username") != null) {
            $scope.continue = true;
            $scope.code = localStorage.getItem("roomCode");
            $scope.username = localStorage.getItem("username");
        }

        $scope.Continue = function () {
            $state.go("userRoom", { "roomCode": $scope.code })
        }
    }])

    // Path: /about
    .controller('CreateCtrl', ['$scope', '$location', '$window', '$state', 'TasteService', 'ToastService', function ($scope, $location, $window, $state, TasteService, ToastService) {


        ToastService.InitToast();
        $scope.room = new Object();
        $scope.loading = false;
        $scope.CreateRoom = function () {
            $scope.loading = true;
            TasteService.CreateRoom($scope.room).then(function (data) {
                $scope.loading = false;
                var roomCode = data.roomCode;
                localStorage.setItem("pin", $scope.room.pin);
                localStorage.setItem("roomCode", roomCode);
                $state.go('room', { "roomCode": localStorage.getItem("roomCode") });
            });
        }

    }])

    .controller('RoomCtrl', ['$scope', '$stateParams', '$location', '$window', '$state', 'TasteService', 'ToastService', function ($scope, $stateParams, $location, $window, $state, TasteService, ToastService) {

        $scope.search = new Object();
        $scope.review = new Object();
        $scope.type = 'pickingBeer',

        $scope.breweries = [];
        $scope.selectedBeers = [];
        $scope.selectedCategories = [];
        $scope.breweryNotListed = false;

        TasteService.GetBreweries().then(function (data) {
            $scope.breweries = data;
            $scope.breweries.push
        });

        

        TasteService.GetReviewTypes().then(function (data) {
            $scope.reviewTypes = data;
        });



        if (localStorage.getItem("roomPin") == null) {
            //display pin code 
        }

        $scope.GetBreweryeBeers = function (id) {
            if (id == 0) {
                $scope.breweryNotListed = true;
            }

            $scope.search.beerName = "";
            $scope.search.breweryName = "";

            $scope.loadingBeers = true;
            TasteService.GetBreweriesBeers(id).then(function (data) {
                $scope.loadingBeers = false;
                $scope.beers = data;
            });
        }

        $scope.getSelectedText = function () {
            if ($scope.search.brevery !== undefined) {
                return _.where($scope.breweries, {id:  $scope.search.brevery})[0].name 
            } else {
                return "Brewery";
            }
        };

        $scope.getSelectedTextForCategory = function () {
            if ($scope.review.type !== undefined) {
                return _.where($scope.reviewTypes, { id: $scope.review.type })[0].name
            } else {
                return "Category";
            }
        };

        $scope.SelectBeer = function (beer) {
            $scope.selectedBeers.push(beer);
            $scope.beers.splice($scope.beers.indexOf(beer), 1);
        }

        $scope.RemoveBeer = function (beer) {
            $scope.beers.push(beer);
            $scope.beers = _.sortBy($scope.beers, function (b) { return -b.untappedRating; });
            $scope.selectedBeers.splice($scope.selectedBeers.indexOf(beer), 1);
        }

        $scope.addingNewCategory = false;
        $scope.SelectCategory = function (category) {

            var categoryToAdd;
            var addingNew = category.type == 0;
            if (!addingNew) {
                categoryToAdd = _.where($scope.reviewTypes, { id: category.type })[0];
                categoryToAdd.maxValue = category.maxValue;

            }
            else {
                categoryToAdd = {
                    name: category.newName,
                    isNew: true,
                    maxValue: category.maxValue,
                    abbr: category.abbr
                };
            }

            $scope.selectedCategories.push(categoryToAdd);


            if (!addingNew) {
                var index = _.findLastIndex($scope.reviewTypes, { id: category.type });
                $scope.reviewTypes.splice(index, 1);
            }
            $scope.addingNewCategory = false;
            $scope.review.type = undefined;
            $scope.review.maxValue = undefined;
            $scope.review.namenewName = undefined;
            
        }

        $scope.RemoveCategory = function (category) {
            if (!category.isNew) {
                $scope.reviewTypes.push(category);
                $scope.reviewTypes = _.sortBy($scope.reviewTypes, function (c) { return c.name; });
            }
            
            $scope.selectedCategories.splice($scope.selectedCategories.indexOf(category), 1);
        }

        $scope.CategoryChange = function () {
            $scope.review.type;
            if ($scope.review.type == 0)
                $scope.addingNewCategory = true;
        }

        $scope.GetTotal = function() {
            var sum = 0;
            $scope.selectedCategories.forEach(function (r) {
                var parsed = parseInt(r.maxValue);
                if (!isNaN(parsed)) {
                    sum += parsed;
                }
            });

            return sum;
        }


        $scope.showUntappedButton = false;
        $scope.SearchForBeers = function (q, force) {
            var query = q.beerName;
            
            //if (q.brevery != undefined && q.brevery != 0) {
            //    query += _.where($scope.breweries, { id: $scope.search.brevery })[0].name;
            //}
            //else if (q.breweryName != undefined && q.breweryName.length != 0) {
            //    query += q.breweryName;
            //}
            //if (q.beerName != undefined && q.beerName.length != 0) {
            //    if (query.length != 0)
            //        query += " " + q.beerName;
            //    else
            //        query = q.beerName;
            //}

            if (query.length == 0) {
                ToastService.Toast("Your search query is empty!");
            }
            $scope.loadingBeers = true;
            TasteService.SearchForBeers(query, force).then(function (data) {
                if (!force) {
                    $scope.showUntappedButton = false;
                }
                $scope.loadingBeers = false;
                $scope.beers = data;
            });
        }

        $scope.FinshCreation = function () {
            var requestObj = {
                roomCode: localStorage.getItem("roomCode"),
                pin: localStorage.getItem("pin"),
                beers: $scope.selectedBeers,
                categories: $scope.selectedCategories
            }
            $scope.loading = true;
            $scope.buttonDisabled = true;
            TasteService.FinishRoomCreation(requestObj).then(function (data) {
                $scope.loading = false;
                $state.go("dashboard", { "roomCode": localStorage.getItem("roomCode"), "pin": localStorage.getItem("pin") });
            }, function () {
                $scope.buttonDisabled = false;
            });

        }
    }])

    .controller('UserCtrl', ['$scope', '$stateParams', '$location', '$window', 'TasteService', 'ToastService', 'signalRHubProxy', function ($scope, $stateParams, $location, $window, TasteService, ToastService, signalRHubProxy) {
        ToastService.InitToast();
        $scope.initalLoad = true;
        TasteService.GetRoom($stateParams.roomCode, localStorage.getItem("pin"), localStorage.getItem("userId")).then(function (data) {
            $scope.initalLoad = false;
            $scope.data = data;
            console.log(data);

            $scope.data.beverages.forEach(function (b) {
                b.loading = false;
                b.isOpen = false;
                b.reviewTypes = [];
                if (b.review.parts != null) {
                    b.reviewd = true;
                    b.comment = b.review.comment;
                }
                $scope.data.reviewTypes.forEach(function (r) {
                    r.userValue = 0;
                    if (b.reviewd) {
                        var type = _.where(b.review.parts, { "reviewTypeId": r.reviewId })[0];
                        if (type != null)
                            r.userValue = type.score;
                    }

                    var newReview = {
                        id: r.id,
                        reviewId: r.reviewId,
                        name: r.name,
                        maxValue: r.maxValue,
                        userValue: r.userValue
                    }
                    b.reviewTypes.push(newReview);
                });
            });
        });
            
        $scope.OpenBeer = function (beer) {
            $scope.data.beverages.forEach(function (b) {
                b.isOpen = false;
            });
            beer.isOpen = true;
        }

        $scope.GetTotal = function (beer) {
            return _.reduce(beer.reviewTypes, function (memo, type) { return memo + type.userValue; }, 0);

        }

        $scope.GetSelectArr = function (maxNumber) {
            var arr = [];
            for (var i = 0; i <= maxNumber; i++) {
                arr.push(i);
            }
            return arr;
        }

        $scope.SubmitReview = function (beer) {
            beer.loading = true;
            var parts = []
            beer.reviewTypes.forEach(function (r) {
                var newPart = {
                    reviewTypeId: r.reviewId,
                    score: r.userValue
                };
                parts.push(newPart);
            });

            var requestObj = {
                beverageId: beer.beverageId,
                userId: localStorage.getItem("userId"),
                roomCode: localStorage.getItem("roomCode"),
                parts: parts,
                comment: beer.comment
            };
            TasteService.AddReview(requestObj).then(function (data) {
                ToastService.Toast(data, true);
                beer.reviewd = true;
                beer.isOpen = false;
                beer.loading = false;
            }, function () {
                beer.loading = false;
            });
        }

        $scope.clientPushHubProxy = signalRHubProxy('beerhub');
        setTimeout(function () {
            $scope.clientPushHubProxy.invokeSingelParam("JoinRoomAsUser", $stateParams.roomCode, function (data) {
                console.log(data);
            });
        }, 4000)

        $scope.clientPushHubProxy.on("OpenBeer", function (data) {
            $scope.currentBeer = data;
        });
        $scope.clientPushHubProxy.on("PushFinalScore", function (data) {
            setTimeout(function () {
                var beerToAddFinalTo = _.where($scope.data.beverages, { beverageId: data.beerId })[0];
                beerToAddFinalTo.finalScore = data.finalScore;
            }, 7100);
        });
    }])
    .controller('dashboardCtrl', ['$scope', '$stateParams', '$location', '$window', '$state', '$timeout', 'TasteService', 'ToastService', 'signalRHubProxy', function ($scope, $stateParams, $location, $window, $state, $timeout, TasteService, ToastService, signalRHubProxy) {
        ToastService.InitToast();
        $scope.initalLoad = true;

        $scope.DeleteUser = function (id) {
            var user = _.where($scope.data.users, {id: id })[0]

            var person = prompt("Write the name of this user if you want to delete him");
            if (person == user.username)
            {
                if (confirm("Are you sure you want to delete this user") == true) {
                    var requestObj = {
                        userId: user.id
                    };
                    TasteService.DeleteUser(requestObj).then(function (data) {
                        ToastService.Toast(data, true);
                        $scope.data.users = _.reject($scope.data.users, function (u) { return u.id == id });
                        $scope.data.beverages.forEach(function (beer) {
                            beer.reviews = _.reject(beer.reviews, function (b) { return b.userId == id });
                        })
                    })
                } else {
                    console.log("No");
                }
            }
        }

        $scope.LogOut = function () {
            localStorage.clear();
            $state.go('home');
        }


        TasteService.GetDashboard($stateParams.roomCode, $stateParams.pin).then(function (data) {
            if (data.status != 0) {
                ToastService.Toast(data.message, false);
                $state.go("opendashboard");
                return;
            }
            console.log(data);
            $scope.noBeerSelected = true;
            $scope.data = data;
            $scope.initalLoad = false;
            $scope.GetAveForUser();

            $scope.data.beverages.forEach(function (b) {
                b.weightedAve = $scope.CalculateBeerAverage(b.reviews);
            })

            var order = 0;

            $scope.data.beverages.forEach(function (b) {
                if (b.imageUrlMed == undefined)
                    b.imageUrlMed = "N/A";
                b.displayOrder = order;
                b.loading = false;
                b.isOpen = false;
                b.hideResults = false;

                order++;
            });

            $scope.data.hideBeers = data.isBlind;
            $scope.data.unknownBeer = "~/Images/unknown.png";
        });

        $scope.clientPushHubProxy = signalRHubProxy('beerhub');
        setTimeout(function () {
            $scope.clientPushHubProxy.invokeSingelParam("JoinRoom", $stateParams.roomCode, function (data) {
                console.log(data);
            });
        }, 4000)

        $scope.clientPushHubProxy.on("NewUserJoined", function (data) {
            var userObj = {
                username: data.username,
                id: data.userId
            }
            $scope.data.users.push(userObj);
            var parts = [];
            $scope.data.reviewTypes.forEach(function (r) {
                var part = {
                    displayOrder: r.displayOrder,
                    id: 0,
                    reviewTypeId: r.reviewId,
                    score: 0
                };
                parts.push(part);
            });
            
            
            $scope.data.beverages.forEach(function (b) {
                var rev = {
                    id: getRandomInt(0, 100000),
                    username: data.username,
                    userId: data.userId,
                    totalScore: 0,
                    comment: "",
                    parts: _.sortBy(parts, function (i) { return i.displayOrder; }),
                    ave: $scope.GetAveForUser(data.userId),
                    includeInCalculations: false
                };
                b.reviews.push(rev)
            });

            if ($scope.currentReviews.length > 0) {
                $scope.currentReviews.push(rev);
            }

            function getRandomInt(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
            }
        });
        
        $scope.currentBeerId = "";
        $scope.GetNumberOfVotes = function (reviews) {
            $scope.$apply;
            var count = _.where(reviews, { includeInCalculations: true });
            $scope.voted = count.length;
            //if ($scope.voted == reviews.length) {
            //    $scope.FinsihReview($scope.currentBeer);
            //}
        }

        $scope.clientPushHubProxy.on("NewReview", function (data) {
            console.log("data", data);
            var beer = _.where($scope.data.beverages, { "beverageId": data.beverageId })[0];
            var beerReview = _.where(beer.reviews, { "userId": data.userId })[0];
            var user = _.where($scope.currentReviews, { "userId": data.userId })[0];
            if (user.totalScore == 0 && data.totalScore > 0) {
                var ding = new Audio('sounds/clips/bell.wav');
                ding.play();
            }
            user.totalScore = data.totalScore;
            user.comment = data.comment;
            if (user.parts == null || user.parts.length == 0) {
                data.parts.forEach(function (p) {
                    var type = _.where($scope.data.reviewTypes, { "reviewId": p.reviewTypeId })[0];
                    var newPart = {
                        reviewTypeId: p.reviewTypeId,
                        score: p.score,
                        abbr: type.abbr,
                    }
                    user.parts.push(newPart);
                });
            }
            else {
                data.parts.forEach(function (p) {
                    for (var i = 0; i < user.parts.length; i++) {
                        if (user.parts[i].reviewTypeId == p.reviewTypeId) {
                            user.parts[i].score = p.score;
                            break;
                        }
                    }
                });
            }
            user.includeInCalculations = true;
            beerReview.includeInCalculations = true;
            beerReview.totalScore = data.totalScore;
            beerReview.comment = data.comment;
            beerReview.parts = user.parts;

            user.ave = $scope.GetAveForUser(user.userId);
            $scope.currentReviews = _.sortBy($scope.currentReviews, function (r) { return -r.totalScore; });
            $scope.GetNumberOfVotes($scope.currentReviews);
            var textColor = "#fff";
            var red = "#ff6666";
            var pink = "#ffc0cb";
            var orange = "#FFA500";
            var lessOrange = "#ffc966";
            var yellow = "#ffff00";
            var lessYellow = "#ffffb2";
            var lessGreen = "#b2d8b2";
            var success = "#008000";
            var colorToUse;
            if (user.totalScore <= 10)
                colorToUse = red;
            else if (user.totalScore <= 20)
                colorToUse = pink;
            else if (user.totalScore <= 30)
                colorToUse = orange;
            else if (user.totalScore <= 40)
                colorToUse = lessOrange;
            else if (user.totalScore <= 50) {
                colorToUse = yellow;
                textColor = "#7e7e7e";
            }
            else if (user.totalScore <= 60) {
                colorToUse = lessYellow;
                textColor = "#7e7e7e";
            }
            else if (user.totalScore <= 80)
                colorToUse = lessGreen;
            else if (user.totalScore <= 100)
                colorToUse = success;
            $(".reviewsRow." + data.userId + " .blink").css("background-color", colorToUse);
            $(".reviewsRow." + data.userId + " .blink").css("color", textColor);
            setTimeout(function () {
                $(".reviewsRow." + data.userId + " .blink").css("background-color", "#fff");
                $(".reviewsRow." + data.userId + " .blink").css("color", "#7e7e7e");
            }, 2500)
        });

        $scope.currentReviews = [];
        $scope.currentBeer;
        $scope.lastDisplayOrder;

        $scope.OpenBeer = function (beer) {
            console.log("Current Beer: ", beer);
            $scope.currentBeerId = "";
            $scope.showingResults = false;

            $scope.noBeerSelected = false;
            if (beer.isOpen)
                return;
            $scope.currentReviews = [];
            beer.loading = true;
                
            TasteService.UnlockBeer($stateParams.roomCode, beer.beverageId).then(function (data) {
                console.log("Beer data: ", data)
                $scope.data.beverages.forEach(function (b) {
                    b.isOpen = false;
                });
                beer.isOpen = true;
                beer.loading = false;
                beer.reviews.forEach(function (r) {
                    var rev = {
                        username: r.username,
                        userId: r.userId,
                        totalScore: r.totalScore,
                        comment: r.comment,
                        parts: [],
                        ave: $scope.GetAveForUser(r.userId),
                        includeInCalculations: r.includeInCalculations
                    };
                    if (r.parts != null) {
                        r.parts.forEach(function (p) {
                            var type = _.where($scope.data.reviewTypes, { "reviewId": p.reviewTypeId })[0];
                            var newPart = {
                                reviewTypeId: type.reviewId,
                                score: p.score,
                                abbr: type.abbr,
                            }
                            rev.parts.push(newPart);
                        });
                    }
                    $scope.currentReviews.push(rev);

                    $scope.currentReviews = _.sortBy($scope.currentReviews, function (r) { return -r.totalScore; });
                    $scope.currentBeer = beer;
                });


                $scope.GetNumberOfVotes($scope.currentReviews);
                $scope.currentBeerId = beer.beverageId;
                console.log("Current Reviews: ", $scope.currentReviews);
                $scope.CalculateBeerAverage();
            }, function () {
                beer.loading = false;
            });
        }

        $scope.GetAverageClass = function (part, rev) {
            var currentAvePart = _.where(rev.ave.aveParts, { reviewTypeId: part.reviewTypeId })[0];
            if (part.score > currentAvePart.score)
                return "higher";
            else if (part.score < currentAvePart.score)
                return "lower"
            return "";
        }

        $scope.IsLowestAverage = function (part) {
            var aves = _.pluck($scope.currentReviews, "ave");
            var aveparts = _.pluck(aves, "aveParts");
            var arr = [].concat.apply([], aveparts);
            var currentPartArr = _.where(arr, { reviewTypeId: part.reviewTypeId });
            var min = _.min(_.pluck(currentPartArr, "score"));

            return min == part.score
        }

        $scope.IsHighestAverage = function (part) {
            var aves = _.pluck($scope.currentReviews, "ave");
            var aveparts = _.pluck(aves, "aveParts");
            var arr = [].concat.apply([], aveparts);
            var currentPartArr = _.where(arr, { reviewTypeId: part.reviewTypeId });
            var max = _.max(_.pluck(currentPartArr, "score"));

            return max == part.score
        }

        $scope.IsLowestTotalAverage = function (score) {
            var aves = _.pluck($scope.currentReviews, "ave");
            var aveScores = _.pluck(aves, "aveScore");
            var min = _.min(aveScores);
            return min == score
        }

        $scope.IsHighestTotalAverage = function (score) {
            var aves = _.pluck($scope.currentReviews, "ave");
            var aveScores = _.pluck(aves, "aveScore");
            var max = _.max(aveScores);
            return max == score
        }

        $scope.CalculateBeerAverage = function (reviews) {
                
            var numberOfReviews = _.where(reviews, { includeInCalculations: true }).length;
            if (numberOfReviews == 0)
                return 0;

            var sorted = _.sortBy(reviews, function (r) { return -r.totalScore });
            var removedTopAndBottom = [];
            for (var i = 2; i < sorted.length -2; i++) {
                removedTopAndBottom.push(sorted[i]);
            }

            var reviewsWithoutTopAndBott = [];
            var amean = _.reduce(removedTopAndBottom, function (memo, num) { return memo + num.totalScore; }, 0) / (numberOfReviews - 4);

            var distance = [];
            var total = [];
            var weight = [];
            
            for (var i = 0; i < reviews.length; i++) {
                if (!reviews[i].includeInCalculations)
                    continue;

                total.push(reviews[i].totalScore);
                var dist = Math.abs(amean - reviews[i].totalScore);
                distance.push(dist);
                weight.push(Math.pow(100 - dist, 3))

            }

            var dot = math.dot(total, weight);
            var finalScore = dot / _.reduce(weight, function (memo, num) { return memo + num; }, 0);
            return finalScore;
        }

        $scope.GetAveForUser = function (userId) {
            var usersReviewsArr = _.pluck($scope.data.beverages, "reviews");
            var usersReviews = [].concat.apply([], usersReviewsArr);
            usersReviews = _.where(usersReviews, { includeInCalculations: true });
            usersReviews = _.where(usersReviews, {
                userId: userId
            });

            if (usersReviews.length == 0) {
                var partAve = [];
                $scope.data.reviewTypes.forEach(function (type) {
                    var newPart = {
                        reviewTypeId: type.reviewId,
                        displayOrder: type.displayOrder,
                        score: 0,
                        abbr: type.abbr,
                    }
                    partAve.push(newPart);
                });


                var obj = {
                    aveScore: 0,
                    aveParts: partAve
                };
                return obj;
            }

            var parts = _.pluck(usersReviews, "parts");
            parts = [].concat.apply([], parts);
            parts = _.groupBy(parts, "reviewTypeId");

            var aveTotalScore = _.reduce(_.pluck(usersReviews, "totalScore"), function (memo, num) { return memo + num; }, 0) / usersReviews.length;
            var partAve = [];
            for (var propertyName in parts) {
                var currentParts = parts[propertyName]

                var type = _.where($scope.data.reviewTypes, { "reviewId": currentParts[0].reviewTypeId })[0];
                var newPart = {
                    reviewTypeId: type.reviewId,
                    displayOrder: type.displayOrder,
                    score: _.reduce(_.pluck(currentParts, "score"), function (memo, num) { return memo + num; }, 0) / currentParts.length,
                    abbr: type.abbr,
                }
                partAve.push(newPart);
            }
            var obj = {
                aveScore: aveTotalScore,
                aveParts: partAve
            };

            return obj;
        }

        function PrepareCurrentBeerResults(beer, data) {
            $scope.highest = _.sortBy(_.where(beer.reviews, { includeInCalculations: true }), function (i) { return -i.totalScore; })[0];
            $scope.lowest = _.sortBy(_.where(beer.reviews, { includeInCalculations: true }), function (i) { return i.totalScore; })[0];
            $scope.totalScore = data.totalScore;
        }


        var booYouSuck = new Audio('sounds/BooYouSuckSoundEffect.mp3')
        var gay = new Audio('sounds/Hah gay!.mp3');
        var comeOn1 = new Audio('http://www.pacdv.com/sounds/voices/come-on-1.wav');
        var golf = new Audio('http://www.mediacollege.com/downloads/sound-effects/audience/applause-light-01.wav');
        var cheer = new Audio('sounds/Cheering 3-SoundBible.com-1680253418.mp3');
        var applause = new Audio('sounds/Audience_Applause-Matthiew11-1206899159.mp3');
        var haleluja = new Audio('sounds/Hallelujah Chorus Sound Effect.mp3');
        var yeah = new Audio('sounds/Oh Yeah (Sound Effect).mp3');
        var uefa = new Audio('sounds/UEFA Champions League - Theme Song (Short Version).mp3');
        $scope.FinsihReview = function (beer) {
            beer.loading = true;
            TasteService.FinishReview($stateParams.roomCode, beer.beverageId).then(function (data) {
                if (data.status != 0) {
                    ToastService.Toast(data.message, false);
                    beer.loading = false;
                    return;
                }
                $scope.showingResults = true;
                beer.loading = false;
                $scope.selectedBeer = beer;
                var totalScores = _.pluck(_.reject($scope.data.beverages, function (r) {
                    return r.beverageId == beer.beverageId
                }), "results");
                totalScores.push(data);
                
                $scope.currentRank = _.sortBy(totalScores, function (i) { return -i.totalScore; }).indexOf(data) + 1;
                PrepareCurrentBeerResults(beer, data);
                $scope.currentBeerId = beer.beverageId;
                $scope.currentData = data;
                $timeout(function () {
                    var b = _.where($scope.data.beverages, { beverageId: $scope.currentBeerId })[0];
                    b.results = $scope.currentData;
                    b.weightedAve = $scope.CalculateBeerAverage(b.reviews);
                    b.reviewFinished = true;
                }, 7100);

                $timeout(function () {
                    $(".current .ratingHeader.success").fadeIn(1000)
                    $timeout(function () {
                        $(".current .ratingResult.success").fadeIn(1500)
                        $timeout(function () {
                            $timeout(function () {
                                $(".current .ratingHeader.error").fadeIn(1000)
                                $timeout(function () {
                                    $(".current .ratingResult.error").fadeIn(1500)
                                    $timeout(function () {
                                        $timeout(function () {
                                            $(".current .final.header").fadeIn(2000)
                                            $timeout(function () {
                                                $(".current .final.heart").fadeIn(3000)
                                                $(".current .currentRanking").fadeIn(3000)
                                                $timeout(function () {
                                                    if (data.totalScore < 20) {
                                                        booYouSuck.play();
                                                    }
                                                    else if (data.totalScore >= 0 && data.totalScore < 30) {
                                                        gay.play();
                                                    }
                                                    else if (data.totalScore >= 30 && data.totalScore < 45) {
                                                        comeOn1.play();
                                                    }
                                                    else if (data.totalScore >= 45 && data.totalScore < 60) {
                                                        golf.play();
                                                    }
                                                    else if (data.totalScore >= 60 && data.totalScore < 70) {
                                                        applause.play();
                                                    }
                                                    else if (data.totalScore >= 70 && data.totalScore < 75) {
                                                        cheer.play();
                                                    }
                                                    else if (data.totalScore >= 75 && data.totalScore < 80) {
                                                        yeah.play();
                                                    }
                                                    else if (data.totalScore >= 80 && data.totalScore < 85) {
                                                        haleluja.play();
                                                    }
                                                    else if (data.totalScore >= 85 && data.totalScore < 100) {
                                                        uefa.play();
                                                    }
                                                }, 1000)
                                            }, 1000);
                                        }, 1000);
                                    })
                                }, 1000);
                            }, 1000);
                        })
                    }, 1000);
                }, 1000);
            });
        }



    }])
    .controller('joinCtrl', ['$scope', '$stateParams', '$location', '$window', '$state', 'TasteService', 'ToastService', function ($scope, $stateParams, $location, $window, $state, TasteService, ToastService) {
        ToastService.InitToast();
        $scope.room = {
            pin: null
        }
        $scope.loading = false;
        $scope.JoinRoom = function(room) {
            $scope.loading = true;
            TasteService.JoinRoom(room).then(function (data) {
                $scope.loading = false;
                if (data.status != 0) {
                    ToastService.Toast(data.message, false);
                }
                else {
                    localStorage.setItem("userId", data.userId);
                    localStorage.setItem("roomCode", room.roomCode);
                    localStorage.setItem("pin", room.pin);
                    localStorage.setItem("username", room.username);
                    $state.go("userRoom", { "roomCode": room.roomCode });
                }
                
            });
        }
    }])

    .controller('opendashboardCtrl', ['$scope', '$state', function ($scope, $state) {
        $scope.OpenDashboard = function () {
            $state.go("dashboard", { "roomCode": $scope.room.roomCode, "pin": $scope.room.pin });
        }
    }])

    /////////////////////////OLD
    // Path: /login
    //.controller('DashboardCtrl', ['$scope', '$location', '$window', 'beerService', 'signalRHubProxy', function ($scope, $location, $window, beerService, signalRHubProxy) {

    //    var fart = new Audio('sounds/Silly_Farts-Joe-1473367952.mp3');
    //    var horn = new Audio('sounds/Air Horn-SoundBible.com-1561808001.mp3');
    //    var applause = new Audio('sounds/Audience_Applause-Matthiew11-1206899159.mp3');
    //    var cricket = new Audio('sounds/Night_Sounds_-_Crickets-Lisa_Redfern-591005346.mp3');
    //    var cheer = new Audio('sounds/Cheering 3-SoundBible.com-1680253418.mp3');
    //    var sheep = new Audio('sounds/Sheep-SoundBible.com-1847990075.mp3');
    //    var golf = new Audio('http://www.mediacollege.com/downloads/sound-effects/audience/applause-light-01.wav');
    //    var yeah = new Audio('http://www.pacdv.com/sounds/applause-sounds/app-14.mp3');
    //    var haleluja = new Audio('sounds/Hallelujah Chorus Sound Effect.mp3');
    //    var gay = new Audio('sounds/Hah gay!.mp3');
    //    var uefa = new Audio('sounds/UEFA Champions League - Theme Song (Short Version).mp3');

        
    //    $scope.clientPushHubProxy = signalRHubProxy('beerhub');
    //    $scope.clientPushHubProxy.on("hello", function (data) {
    //        console.log("Ding");
    //    });
    //    $scope.votes = [];
    //    $scope.clientPushHubProxy.on("PushVote", function (data) {
    //        console.log(data);
    //        $scope.votes.push(data);
    //    });

    //    $scope.clientPushHubProxy.on("PushEditVote", function (data) {
    //        console.log(data);

    //        for (var i = 0; i < $scope.votes.length; i++) {
    //            if ($scope.votes[i].name == data.name) {
    //                $scope.votes[i] = data;
    //                BlinkEdit(data.name)
    //            }

    //        }
    //    });

    //    function BlinkEdit(username) {
    //        $(".userRow." + username).addClass("red");
    //        setTimeout(function () {
    //            $(".userRow." + username).removeClass("red");
    //            setTimeout(function () {
    //                $(".userRow." + username).addClass("red");
    //                setTimeout(function () {
    //                    $(".userRow." + username).removeClass("red");
    //                    setTimeout(function () {
    //                        $(".userRow." + username).addClass("red");
    //                        setTimeout(function () {
    //                            $(".userRow." + username).removeClass("red");
    //                        }, 500);
    //                    }, 500);
    //                }, 500);
    //            }, 500);
    //        }, 500);

    //    }

    //    $scope.clientPushHubProxy.on("PushBeerStatus", function (data) {
    //        console.log(data);

    //        if ($scope.data.revs.length == 0)
    //            $scope.data.revs.push(data);
    //        var found = false;
    //        for (var i = 0; i < $scope.data.revs.length; i++) {
    //            if ($scope.data.revs[i].name == data.name) {
    //                $scope.data.revs[i] = data;
    //                found = true;
    //            }
    //        }
    //        if (!found) {
    //            $scope.data.revs.push(data);
    //        }

    //        if (data.votingFinished) {
    //            if (data.total < 30) {
    //                fart.play();
    //            }
    //            else if (data.total > 30 && data.total < 45) {
    //                gay.play();
    //            }
    //            else if (data.total > 45 && data.total < 60) {
    //                sheep.play();
    //            }
    //            else if (data.total > 60 && data.total < 70) {
    //                golf.play();
    //            }
    //            else if (data.total > 70 && data.total < 80) {
    //                applause.play();
    //            }
    //            else if (data.total > 80 && data.total < 90) {
    //                yeah.play();
    //            }
    //            else if (data.total > 90 && data.total < 100) {
    //                haleluja.play();
    //            }
    //            else if (data.total > 100) {
    //                uefa.play();
    //            }
    //        }
    //    });

        

    //    beerService.Initdashboard().then(function (data) {
    //        $scope.data = data;
    //        console.log(data);
    //    });
    //    var openTimeOut;
    //    $scope.ExpandBeer = function (id) {
    //        clearTimeout(openTimeOut);
    //        console.log(id);
    //        var wasVisible = $(".reviewContainer." + id).is(":visible");
    //        $(".reviewContainer").slideUp();

    //        if (!wasVisible) {
    //            $(".reviewContainer." + id).slideDown();
    //        }
    //        $scope.votes = [];
    //        beerService.CloseAllBeers().then(function (data) {
    //            $scope.openBeer = -1;

    //            if (!wasVisible) {
    //                beerService.OpenBeer(id).then(function (data) {
    //                    $scope.openBeer = id;

    //                    openTimeOut = setTimeout(function () {
    //                        if($scope.votes.length == 0)
    //                            cricket.play(); 
    //                        setTimeout(function () {
    //                            cricket.pause();
    //                        }, 7000)
    //                    }, 300000);

    //                    $scope.votes = data;
    //                });
    //            }
    //            else {
    //                $scope.open = -1;
    //            }
    //        });

           
    //    }


    //    setTimeout(function () {

    //    }, 2000)
    //}])

    // Path: /error/404
    .controller('Error404Ctrl', ['$scope', '$location', '$window', function ($scope, $location, $window) {
        $scope.$root.title = 'Error 404: Page Not Found';
        $scope.$on('$viewContentLoaded', function () {
            $window.ga('send', 'pageview', { 'page': $location.path(), 'title': $scope.$root.title });
        });
    }]);