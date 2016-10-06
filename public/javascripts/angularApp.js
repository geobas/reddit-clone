var app = angular.module('redditClone', ['ui.router', 'ui.bootstrap']);

app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider.state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainCtrl',
            resolve: {
                postPromise: ['Posts',
                    function(Posts) {
                        return Posts.getAll();
                    }
                ]
            }
        }).
        state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            controller: 'PostsCtrl',
            resolve: {
                post: ['$stateParams', 'Posts',
                    function($stateParams, Posts) {
                        return Posts.getOne($stateParams.id);
                    }
                ]
            }
        }).
        state('login', {
            url: '/login',
            templateUrl: '/login.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'Auth',
                function($state, Auth) {
                    if (Auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }
            ]
        }).
        state('register', {
            url: '/register',
            templateUrl: '/register.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'Auth',
                function($state, Auth) {
                    if (Auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }
            ]
        });

        $urlRouterProvider.otherwise('home');
    }
]);

app.controller('MainCtrl', ['$rootScope', '$scope', 'Posts', 'Auth',
    function($rootScope, $scope, Posts, Auth) {

        $rootScope.error = false;
        $scope.posts = Posts.posts;

        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '') {
                return;
            }
            Posts.createPost({
                title: $scope.title,
                link: $scope.link,
            });
            $scope.title = '';
            $scope.link = '';
            $rootScope.error = false;
        };

        $scope.incrementUpvotes = function(post) {
            if (!Auth.isLoggedIn())
                $scope.error = 'You need to be logged in to upvote.';
            Posts.upVote(post);
        };

        $scope.decrementUpvotes = function(post) {
            if (!Auth.isLoggedIn())
                $scope.error = 'You need to be logged in to downvote.';
            Posts.downVote(post);
        };

        $scope.isLoggedIn = Auth.isLoggedIn;

        $scope.closeAlert = function() {
            $scope.error = false;
        };

        $scope.notValid = function(url) {
            var pattern = /^((http|https|ftp):\/\/)/;
            if (!pattern.test(url)) {
                return true;
            }
        };
    }
]);

app.controller('PostsCtrl', ['$rootScope', '$scope', 'Posts', 'post', 'Auth',
    function($rootScope, $scope, Posts, post, Auth) {

        $rootScope.error = false;
        $scope.post = post;

        $scope.addComment = function() {
            if (!$scope.body || $scope.body === '') {
                return;
            }

            Posts.addComment(post._id, {
                body: $scope.body,
                author: 'user',
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });

            $scope.body = '';
        };

        $scope.incrementUpvotes = function(comment) {
            if (!Auth.isLoggedIn())
                $scope.error = 'You need to be logged in to upvote.';
            Posts.upvoteComment(post, comment);
        };

        $scope.decrementUpvotes = function(comment) {
            if (!Auth.isLoggedIn())
                $scope.error = 'You need to be logged in to downvote.';
            Posts.downvoteComment(post, comment);
        };

        $scope.isLoggedIn = Auth.isLoggedIn;

        $scope.closeAlert = function() {
            $scope.error = false;
        };

        $scope.notValid = function(url) {
            var pattern = /^((http|https|ftp):\/\/)/;
            if (!pattern.test(url)) {
                return true;
            }
        };
    }
]);

app.controller('AuthCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    'Auth',
    function($rootScope, $scope, $state, Auth) {

        $rootScope.error = false;
        $scope.user = {};

        $scope.register = function() {
            Auth.register($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('home');
            });
        };

        $scope.logIn = function() {
            Auth.login($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('home');
            });
        };
    }
]);

app.controller('NavCtrl', [
    '$scope',
    'Auth',
    function($scope, Auth) {
        $scope.isLoggedIn = Auth.isLoggedIn;
        $scope.currentUser = Auth.currentUser;
        $scope.logOut = Auth.logout;
    }
]);

app.factory('Posts', ['$rootScope', '$http', 'Auth',
    function($rootScope, $http, Auth) {

        function getAllPosts() {
            return $http.get('/posts').success(function(data) {
                angular.copy(data, o.posts);
            });
        };

        function createNewPost(post) {
            return $http.post('/posts', post, {
                headers: {
                    Authorization: 'Bearer ' + Auth.getToken()
                }
            }).success(function(data) {
                o.posts.push(data);
            });
        }

        function incrementPostVote(post) {
            return $http.put('/posts/' + post._id + '/upvote', null, {
                headers: {
                    Authorization: 'Bearer ' + Auth.getToken()
                }
            }).success(function(data) {
                post.upvotes += 1;
            }).error(function() {
                $rootScope.error = 'You have already voted.';
            });
        }

        function decrementPostVote(post) {
            return $http.put('/posts/' + post._id + '/downvote', null, {
                headers: {
                    Authorization: 'Bearer ' + Auth.getToken()
                }
            }).success(function(data) {
                post.upvotes -= 1;
            }).error(function() {
                $rootScope.error = 'You have already voted.';
            });
        }

        function getPost(id) {
            return $http.get('/posts/' + id).then(function(res) {
                return res.data;
            });
        }

        function addNewComment(id, comment) {
            return $http.post('/posts/' + id + '/comments', comment, {
                headers: {
                    Authorization: 'Bearer ' + Auth.getToken()
                }
            });
        }

        function incrementCommentVote(post, comment) {
            return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
                headers: {
                    Authorization: 'Bearer ' + Auth.getToken()
                }
            }).success(function(data) {
                comment.upvotes += 1;
                $rootScope.error = false;
            }).error(function() {
                $rootScope.error = 'You have already voted.';
            });
        }

        function decrementCommentVote(post, comment) {
            return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', null, {
                headers: {
                    Authorization: 'Bearer ' + Auth.getToken()
                }
            }).success(function(data) {
                comment.upvotes -= 1;
            }).error(function() {
                $rootScope.error = 'You have already voted.';
            });
        }

        var o = {
            posts: [],
            getAll: getAllPosts,
            getOne: getPost,
            createPost: createNewPost,
            upVote: incrementPostVote,
            downVote: decrementPostVote,
            addComment: addNewComment,
            upvoteComment: incrementCommentVote,
            downvoteComment: decrementCommentVote
        };

        return o;
    }
]);

app.factory('Auth', ['$rootScope', '$http', '$window',
    function($rootScope, $http, $window) {

        function saveToken(token) {
            $window.localStorage['reddit-clone-token'] = token;
        }

        function getToken() {
            return $window.localStorage['reddit-clone-token'];
        }

        function checkIfUserisLoggedIn() {
            var token = auth.getToken();

            if (token) {
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        };

        function getCurrentUser() {
            if (auth.isLoggedIn()) {
                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.username;
            }
        };

        function registerUser(user) {
            return $http.post('/register', user).success(function(data) {
                auth.saveToken(data.token);
            });
        };

        function logInUser(user) {
            return $http.post('/login', user).success(function(data) {
                auth.saveToken(data.token);
            });
        };

        function logOutUser() {
            $rootScope.error = false;
            $window.localStorage.removeItem('reddit-clone-token');
        };

        var auth = {
            saveToken: saveToken,
            getToken: getToken,
            isLoggedIn: checkIfUserisLoggedIn,
            currentUser: getCurrentUser,
            register: registerUser,
            login: logInUser,
            logout: logOutUser
        };

        return auth;
    }
]);