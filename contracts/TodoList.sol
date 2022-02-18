pragma solidity ^0.5.0;

contract TodoList {
    uint256 public taskCount = 0;

    struct Task {
        uint256 id;
        string content;
        bool completed;
    }

    mapping(uint256 => Task) public tasks;

    constructor() public {
        createTask("Hello! This is a new task in your To-Do list");
    }

    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false);
    }

    function deleteTask(uint256 _id) public {
        for (uint256 i = _id; i < taskCount; i++) {
            tasks[i] = tasks[i + 1];
        }
        taskCount--;
    }
}
