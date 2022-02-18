App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadWeb3();
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            // web3 = new Web3(web3.currentProvider);
        } else {
            window.alert("Please connect to Metamask.");
        }

        // Modern dapp browsers...
        if (window.ethereum) {
            // window.web3 = new Web3(ethereum);
            // try {
            //     // Request account access if needed
            //     // Acccounts now exposed
            //     // web3.eth.sendTransaction({/* ... */ });
            //     const transactionHash = await ethereum.request({
            //         method: 'eth_sendTransaction',
            //         params: [{}]
            //     });
            //     console.log(transactionHash);
            // }
            // catch (error) {
            //     // User denied account access...
            //     console.error(error);
            // }
            ethereum
                .request({ method: 'eth_requestAccounts' })
                // .then(handleAccountsChanged)
                .catch((error) => {
                    if (error.code === 4001) {
                        // EIP-1193 userRejectedRequest error
                        console.log('Please connect to MetaMask.');
                    } else {
                        console.error(error);
                    }
                });
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider;
            window.web3 = new Web3(web3.currentProvider);
            // Acccounts always exposed
            // web3.eth.sendTransaction({/* ... */ });
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    },

    loadAccount: async () => {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            App.account = accounts[0];
            console.log(App.account);
        }
    },

    loadContract: async () => {
        const todoList = await $.getJSON('TodoList.json');
        App.contracts.TodoList = window.TruffleContract(todoList);
        App.contracts.TodoList.setProvider(App.web3Provider);

        // Hydrate the smart contract with values from the blockchain
        App.todoList = await App.contracts.TodoList.deployed();
    },

    render: async () => {
        // Prevent double render
        if (App.loading) {
            return;
        }
    
        // Update app loading state
        App.setLoading(true);
    
        // Render Account
        $('#account').html(App.account)
    
        // Render Tasks
        await App.renderTasks();
    
        // Update loading state
        App.setLoading(false);
    },


    renderTasks: async () => {
        // Load the total task count from the blockchain
        const taskCount = await App.todoList.taskCount();
        const $taskTemplate = $('.taskTemplate');

        // Render out each task with a new task template
        for (var i = 1; i <= taskCount; i++) {
            // Fetch the task data from the blockchain
            const task = await App.todoList.tasks(i);
            const taskId = task.id.toNumber();
            const taskContent = task.content;
            const taskCompleted = task.completed;

            // Create the html for the task
            const $newTaskTemplate = $taskTemplate.clone();
            $newTaskTemplate.find('.content').html(taskContent);
            $newTaskTemplate.find('input')
                            // .prop('name', taskId)
                            .prop('checked', taskCompleted)
                            // .on('click', App.toggleCompleted);
            $newTaskTemplate.find('button').prop('name', taskId);

            // Put the task in the correct list
            if (taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate);
            } else {
                $('#taskList').append($newTaskTemplate);
            }

            // Show the task
            $newTaskTemplate.show();
        }
    },

    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $('#loader');
        const content = $('#content');
        if (boolean) {
          loader.show();
          content.hide();
        } else {
          loader.hide();
          content.show();
        }
    },

    createTask: async () => {
        console.log('createTask');
        const newTask = $('#newTask').val();
        await App.todoList.createTask(newTask, { from: App.account });
        window.location.reload();
    },

    deleteTask: async (event) => {
        console.log('deleteTask');
        const taskId = parseInt(event.target.name);
        console.log({taskId});
        await App.todoList.deleteTask(taskId, { from: App.account });
        window.location.reload();
    }
}

$(() => {
    $(window).load(() => {
        App.load();
    });

    $('.taskTemplate input[type="checkbox"]').css({
        "margin-right": "0.25em",
    });
})