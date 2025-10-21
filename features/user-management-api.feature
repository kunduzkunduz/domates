@api @rest @users
Feature: User Management API
  As a system administrator
  I want to manage user accounts through the API
  So that I can maintain user data and permissions

  Background:
    Given the API server is running
    And I have valid admin credentials
    And the user database is accessible

  @api @crud @positive
  Scenario: Create a new user
    Given I have the following user data:
      | field     | value              |
      | email     | newuser@example.com|
      | firstName | John               |
      | lastName  | Doe                |
      | role      | user               |
    When I send a POST request to "/api/users"
    Then the response status should be "201"
    And the response should contain the user data
    And the user should be created in the database
    And I should receive a user ID

  @api @crud @retrieve
  Scenario: Retrieve user by ID
    Given a user exists with ID "123"
    When I send a GET request to "/api/users/123"
    Then the response status should be "200"
    And the response should contain the user data
    And the user email should be "user@example.com"

  @api @crud @update
  Scenario: Update user information
    Given a user exists with ID "123"
    And I have the following update data:
      | field | value        |
      | firstName | Jane     |
      | lastName  | Smith    |
    When I send a PUT request to "/api/users/123"
    Then the response status should be "200"
    And the user data should be updated
    And the firstName should be "Jane"
    And the lastName should be "Smith"

  @api @crud @delete
  Scenario: Delete user account
    Given a user exists with ID "123"
    When I send a DELETE request to "/api/users/123"
    Then the response status should be "204"
    And the user should be removed from the database
    And subsequent requests for the user should return "404"

  @api @validation @negative
  Scenario: Create user with invalid data
    Given I have invalid user data with missing email
    When I send a POST request to "/api/users"
    Then the response status should be "400"
    And the response should contain validation errors
    And the error message should include "Email is required"
    And no user should be created in the database

  @api @authentication @security
  Scenario: Access user data without authentication
    Given I do not have valid authentication credentials
    When I send a GET request to "/api/users"
    Then the response status should be "401"
    And the response should contain "Unauthorized"
    And I should not receive any user data

  @api @pagination @list
  Scenario: List users with pagination
    Given there are "25" users in the database
    When I send a GET request to "/api/users?page=1&limit=10"
    Then the response status should be "200"
    And the response should contain "10" users
    And the response should include pagination metadata
    And the total count should be "25"

  @api @search @filter
  Scenario: Search users by email
    Given there are users with emails containing "admin"
    When I send a GET request to "/api/users?search=admin"
    Then the response status should be "200"
    And the response should contain only users with "admin" in their email
    And each user should have "admin" in their email address

  @api @bulk @operations
  Scenario: Bulk update user roles
    Given I have the following user IDs and roles:
      | userId | role  |
      | 123    | admin |
      | 456    | user  |
      | 789    | moderator |
    When I send a PATCH request to "/api/users/bulk-update-roles"
    Then the response status should be "200"
    And all specified users should have their roles updated
    And I should receive a confirmation of the updates



