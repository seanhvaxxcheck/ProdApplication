import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseDebugInfo: React.FC = () => {
  const [debugOutput, setDebugOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebug = async () => {
      const logs: string[] = [];

      logs.push('=== SUPABASE DEBUG INFO ===');

      // 1. Print environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('=== SUPABASE ENVIRONMENT VARIABLES ===');
      console.log('VITE_SUPABASE_URL:', supabaseUrl);
      console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}` : 'undefined');
      
      logs.push(`VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}`);
      logs.push(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}` : 'undefined'}`);

      if (!supabaseUrl || !supabaseAnonKey) {
        logs.push('❌ ERROR: Missing Supabase environment variables!');
        logs.push('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
        setDebugOutput(logs);
        setLoading(false);
        return;
      }

      // 2. Test basic connection
      logs.push('\n--- TESTING SUPABASE CONNECTION ---');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          logs.push(`❌ Auth session error: ${sessionError.message}`);
          console.error('Auth session error:', sessionError);
        } else {
          logs.push(`✅ Auth connection successful`);
          logs.push(`Current user: ${session?.user?.email || 'Not authenticated'}`);
          console.log('Current session:', session);
        }
      } catch (err: any) {
        logs.push(`❌ Connection test failed: ${err.message}`);
        console.error('Connection test error:', err);
      }

      // 3. Query latest 5 users from auth.users (via profiles table as proxy)
      logs.push('\n--- ATTEMPTING TO FETCH LATEST 5 USERS ---');
      try {
        // Direct access to auth.users is not permitted from client-side with anon key
        // We'll try to query profiles table instead, which is typically linked to auth.users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('=== PROFILES QUERY RESULT ===');
        console.log('Profiles data:', profiles);
        console.log('Profiles error:', profilesError);

        if (profilesError) {
          logs.push(`❌ Error fetching profiles: ${profilesError.message}`);
          logs.push(`Error code: ${profilesError.code}`);
          logs.push(`Error details: ${profilesError.details}`);
          logs.push('Note: Direct access to auth.users requires service_role key');
          logs.push('Profiles table may not exist or RLS policies may be restricting access');
        } else if (profiles && profiles.length > 0) {
          logs.push(`✅ Successfully fetched ${profiles.length} profiles:`);
          profiles.forEach((profile, index) => {
            logs.push(`  ${index + 1}. ID: ${profile.id}`);
            logs.push(`     Email: ${profile.email || 'N/A'}`);
            logs.push(`     Name: ${profile.full_name || 'N/A'}`);
            logs.push(`     Created: ${profile.created_at}`);
          });
        } else {
          logs.push('⚠️ No profiles found or accessible');
          logs.push('This could mean:');
          logs.push('- No users exist yet');
          logs.push('- RLS policies are restricting access');
          logs.push('- You need to be authenticated to see data');
        }
      } catch (err: any) {
        logs.push(`❌ Unexpected error fetching profiles: ${err.message}`);
        console.error('Profiles fetch error:', err);
      }

      // 4. Try to get current user info
      logs.push('\n--- CURRENT USER INFO ---');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('=== CURRENT USER ===');
        console.log('User data:', user);
        console.log('User error:', userError);

        if (userError) {
          logs.push(`❌ Error getting current user: ${userError.message}`);
        } else if (user) {
          logs.push(`✅ Current user authenticated:`);
          logs.push(`   ID: ${user.id}`);
          logs.push(`   Email: ${user.email}`);
          logs.push(`   Created: ${user.created_at}`);
          logs.push(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        } else {
          logs.push('ℹ️ No user currently authenticated');
        }
      } catch (err: any) {
        logs.push(`❌ Error checking current user: ${err.message}`);
        console.error('Current user error:', err);
      }

      // 5. Query list of tables in public schema
      logs.push('\n--- ATTEMPTING TO FETCH PUBLIC SCHEMA TABLES ---');
      try {
        // This will likely fail with anon key due to security restrictions
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');

        console.log('=== TABLES QUERY RESULT ===');
        console.log('Tables data:', tables);
        console.log('Tables error:', tablesError);

        if (tablesError) {
          logs.push(`❌ Error fetching tables: ${tablesError.message}`);
          logs.push(`Error code: ${tablesError.code}`);
          logs.push('Note: Access to information_schema is restricted with anon key');
          logs.push('This is normal security behavior');
          
          // Try alternative approach - test known tables
          logs.push('\n--- TESTING KNOWN TABLES ---');
          const knownTables = ['profiles', 'inventory_items', 'wishlist_items'];
          
          for (const tableName of knownTables) {
            try {
              const { error: testError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
              
              if (testError) {
                if (testError.code === '42P01') {
                  logs.push(`❌ Table '${tableName}' does not exist`);
                } else {
                  logs.push(`⚠️ Table '${tableName}' exists but access restricted: ${testError.message}`);
                }
              } else {
                logs.push(`✅ Table '${tableName}' exists and accessible`);
              }
            } catch (err: any) {
              logs.push(`❌ Error testing table '${tableName}': ${err.message}`);
            }
          }
        } else if (tables && tables.length > 0) {
          logs.push(`✅ Successfully fetched ${tables.length} tables in public schema:`);
          tables.forEach((table: any, index) => {
            logs.push(`  ${index + 1}. ${table.table_name}`);
          });
        } else {
          logs.push('⚠️ No tables found in public schema');
        }
      } catch (err: any) {
        logs.push(`❌ Unexpected error fetching tables: ${err.message}`);
        console.error('Tables fetch error:', err);
      }

      // 6. Test a simple RPC call
      logs.push('\n--- TESTING RPC FUNCTIONALITY ---');
      try {
        // Test if we can call a simple RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('version');
        
        console.log('=== RPC TEST RESULT ===');
        console.log('RPC data:', rpcData);
        console.log('RPC error:', rpcError);

        if (rpcError) {
          logs.push(`⚠️ RPC test failed: ${rpcError.message}`);
          logs.push('This is normal if no custom RPC functions are defined');
        } else {
          logs.push(`✅ RPC functionality working`);
          logs.push(`Database version info: ${JSON.stringify(rpcData)}`);
        }
      } catch (err: any) {
        logs.push(`⚠️ RPC test error: ${err.message}`);
      }

      logs.push('\n=== DEBUG INFO COMPLETE ===');
      logs.push(`Timestamp: ${new Date().toISOString()}`);
      
      console.log('=== COMPLETE DEBUG OUTPUT ===');
      console.log(logs.join('\n'));
      
      setDebugOutput(logs);
      setLoading(false);
    };

    runDebug();
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Supabase Debug Information
      </h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-gray-700 dark:text-gray-300">Running debug checks...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border">
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-auto whitespace-pre-wrap font-mono">
              {debugOutput.join('\n')}
            </pre>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 Debug Tips:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Check the browser console for detailed logs</li>
              <li>• Errors accessing auth.users or information_schema are normal with anon key</li>
              <li>• Use service_role key in Edge Functions for admin operations</li>
              <li>• RLS policies may restrict data access - this is good for security</li>
              <li>• Missing tables indicate database migrations may need to be run</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseDebugInfo;