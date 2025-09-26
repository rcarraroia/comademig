# Implementation Plan

- [x] 1. Setup database constraints and validation



  - Create migration script to add uniqueness constraints for member_types.name and subscription_plans.plan_title
  - Add minimum price constraint (>= 25.00) to subscription_plans.price
  - Add recurrence constraint to accept only 'Mensal' or 'Anual'
  - Create performance indexes for optimized queries
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. Create Edge Function for unified member type creation


  - Implement create-unified-member-type Edge Function with TypeScript
  - Add Zod schema validation for input data
  - Implement Asaas Gateway integration for plan creation
  - Create PostgreSQL transaction logic with rollback capability
  - Add comprehensive error handling and logging
  - _Requirements: 1.6, 1.7, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3_



- [x] 3. Implement custom hook for data fetching

  - Create useMemberTypeWithPlan custom hook using TanStack Query
  - Implement denormalized query joining member_types, subscription_plans, and member_type_subscriptions
  - Add proper TypeScript interfaces for UnifiedMemberType


  - Implement loading states, error handling, and cache management
  - _Requirements: 3.5, 6.1, 6.2, 6.3_

- [x] 4. Create unified admin form component


  - Build UnifiedMemberTypeForm component with separate sections for cargo and financial data
  - Implement real-time validation using React Hook Form and Zod

  - Add uniqueness validation feedback for names and titles
  - Create currency input formatting for contribution values
  - Add dropdown for billing frequency with only 'Mensal' and 'Anual' options
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.5, 4.6_

- [x] 5. Update admin dashboard integration

  - Integrate UnifiedMemberTypeForm into existing member types management page
  - Update member types listing to display both cargo and financial information
  - Implement success/error feedback for form submissions
  - Add loading states during Edge Function execution
  - _Requirements: 1.6, 1.7, 5.3, 5.4_

- [x] 6. Restructure admin menu navigation


  - Update DashboardSidebar.tsx to rename "Assinaturas" to "Gateway de Pagamento"
  - Maintain "Tipos de Membro" as primary unified creation interface
  - Update routing and navigation logic
  - Ensure backward compatibility with existing admin workflows
  - _Requirements: 5.1, 5.2, 6.4_

- [x] 7. Create public member type selector component


  - Build MemberTypeSelector component using useMemberTypeWithPlan hook
  - Implement dropdown interface showing only active member types
  - Create automatic billing summary display when type is selected
  - Add state management for selected member type with unified data
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Update public filiacao page integration


  - Integrate MemberTypeSelector into existing Filiacao.tsx page
  - Update form state management to store unified member type data
  - Modify checkout flow to use pre-selected plan data
  - Remove plan selection from PaymentCheckout component
  - _Requirements: 3.4, 3.5_

- [x] 9. Implement comprehensive error handling



  - Add client-side validation with specific error messages for each constraint
  - Implement server-side error response handling in components
  - Create user-friendly error displays for uniqueness violations
  - Add retry mechanisms for transient failures
  - _Requirements: 1.7, 4.5, 4.6_

- [ ] 10. Create unit tests for Edge Function
  - Write tests for input validation scenarios using Zod schema
  - Test transaction rollback scenarios with mocked database failures
  - Mock Asaas Gateway integration and test error handling
  - Test uniqueness constraint validation
  - _Requirements: 7.4, 7.5_

- [ ] 11. Create component tests for unified form
  - Test form validation behavior with various input combinations
  - Test real-time uniqueness validation feedback
  - Test currency formatting and numeric validation
  - Test dropdown constraints for billing frequency
  - Test form submission and error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 12. Create integration tests for public flow
  - Test complete member type selection and checkout flow
  - Test data consistency between selection and payment
  - Test error scenarios and user feedback
  - Test backward compatibility with existing user data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.3, 6.5_

- [ ] 13. Implement data migration compatibility
  - Create validation script to ensure existing data integrity
  - Test that current member types and plans continue functioning
  - Verify that existing user associations remain intact
  - Test new unified flow alongside legacy data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14. Add performance optimizations
  - Implement proper indexing for denormalized queries
  - Add query optimization for member type listing
  - Implement caching strategies for frequently accessed data
  - Add connection pooling considerations for Edge Function
  - _Requirements: 3.5, 7.4_

- [ ] 15. Create monitoring and logging
  - Add comprehensive logging to Edge Function for debugging
  - Implement audit trail for member type and plan creation
  - Add performance monitoring for database queries
  - Create error tracking for production issues
  - _Requirements: 7.5_