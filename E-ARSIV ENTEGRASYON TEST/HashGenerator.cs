using System.Security.Cryptography;

namespace Global.Test.EArchive.ConsoleTestCustomer
{
    public class HashGenerator
    {
        private MD5 Md5 = MD5.Create();

        public string GetMD5Hash(byte[] filebyteArray)
        {
            if (filebyteArray != null && filebyteArray.Length > 0)
            {
                byte[] hashData = Md5.ComputeHash(filebyteArray, 0, filebyteArray.Length);
                return HexBytesToString(hashData);
            }

            return null;
        }

        public string HexBytesToString(byte[] bytes)
        {
            string result = "";
            foreach (byte b in bytes) result += b.ToString("x2");
            return result;
        }
    }
}
