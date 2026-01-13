using Ionic.Zip;
using System;
using System.IO;
using System.ServiceModel;

namespace Global.Test.EArchive.ConsoleTestCustomer
{
    class Program
    {
        public static readonly string TestUserName = "TESTER@VRBN";
        public static readonly string TestPassword = "Vtest*2020*";
        public static string sessionCode = null;

        static void Main(string[] args)
        {
            LOGIN_TEST();
            //TRANSFER_EARSIV_YENI_NESIL_ENTEGRASYON_KODU_TEST(); // bu metodu kullanmalısınız.
        }

        private static void LOGIN_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                try
                {
                    sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    Console.WriteLine("GİRİŞ BAŞARILI");
                    Console.WriteLine("=================");
                    Console.WriteLine(string.Format("SESSION CODE : {0}", sessionCode));
                }
                catch (TimeoutException timeProblem)
                {
                    Console.WriteLine(timeProblem.Message);
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    Console.WriteLine(veribanFault.Detail.FaultCode);
                    Console.WriteLine(veribanFault.Detail.FaultDescription);
                }
                catch (CommunicationException commProblem)
                {
                    Console.WriteLine(commProblem.Message);
                }
                catch (Exception unknownEx)
                {
                    Console.WriteLine(unknownEx.Message);
                }
            }

            Console.ReadLine();
        }
        private static void VKNTCKN_EFATURA_MUKELLEFIMI()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.OperationResult operationResult = null;
                try
                {
                    string registerNumber = "9240481875";

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    operationResult = serviceClient.CheckRegisterNumberIsEInvoiceCustomer(sessionCode, registerNumber);
                }
                catch (TimeoutException timeProblem)
                {
                    operationResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    operationResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    operationResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    operationResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

            }

            Console.ReadLine();
        }
        private static void TRANSFER_EARSIV_FATURA_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferResult transferResult = null;

                try
                {
                    string fileFullPath = @"04_ORNEK.xml";

                    //Gönderilecek dosya ZipBinaryArray'e dönüştürülür.
                    byte[] zipFileBinaryDataArray = null;
                    using (MemoryStream memoryStreamOutput = new MemoryStream())
                    {
                        using (ZipFile zip = new ZipFile())
                        {
                            zip.AddFile(fileFullPath, string.Empty);
                            zip.Save(memoryStreamOutput);
                        }
                        zipFileBinaryDataArray = memoryStreamOutput.ToArray();
                    }

                    //Zip Binary Data Array'in Standart MD5 Hash bilgisi hesaplanır.
                    HashGenerator hashGenerator = new HashGenerator();
                    string zipFileHash = hashGenerator.GetMD5Hash(zipFileBinaryDataArray);

                    IntegrationServiceRef.EArchiveTransferFile transferFile = new IntegrationServiceRef.EArchiveTransferFile()
                    {
                        FileNameWithExtension = Path.GetFileNameWithoutExtension(fileFullPath) + ".zip",    //Transfer edilecek dosya adı, dosya uzantısı .zip olmalıdır.
                        FileDataType = IntegrationServiceRef.TransferDocumentDataTypes.XML_INZIP,           //ZIP dosyası içerisindeki dosya formatı XML.
                        BinaryData = zipFileBinaryDataArray,                                                //ZIP dosyası Binary64 Data
                        BinaryDataHash = zipFileHash,                                                       //ZIP dosyası Binary64 Data MD5 Hash değeri

                        //ReceiverMailTargetAddresses = new string[] { "ABC@XXX.COM", "XYZ@XXX.NET" },        //(Opsiyonel) Mail gönderilecek alıcı mail adresleri.

                        InvoiceTransportationType = IntegrationServiceRef.InvoiceTransportationTypes.ELEKTRONIK,
                        IsInvoiceCreatedAtDelivery = true,
                        IsInternetSalesInvoice = true,
                    };

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferResult = serviceClient.TransferSalesInvoiceFile(sessionCode, transferFile);
                }
                catch (TimeoutException timeProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferResult.OperationCompleted)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("!!! TRANSFER BAŞARILI !!!");

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine(Environment.NewLine + "TRANSFER DÖKÜMAN NUMARASI [ " + transferResult.TransferFileUniqueId + " ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! TRANSFER BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + transferResult.Description);
            }

            Console.ReadLine();
        }
        private static void TRANSFER_EARSIV_MUSTAHSIL_MAKBUZU_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferResult transferResult = null;

                try
                {
                    string fileFullPath = @"MANUFACTURED_RECEIPT_BORSA.xml";

                    //Gönderilecek dosya ZipBinaryArray'e dönüştürülür.
                    byte[] zipFileBinaryDataArray = null;
                    using (MemoryStream memoryStreamOutput = new MemoryStream())
                    {
                        using (ZipFile zip = new ZipFile())
                        {
                            zip.AddFile(fileFullPath, string.Empty);
                            zip.Save(memoryStreamOutput);
                        }
                        zipFileBinaryDataArray = memoryStreamOutput.ToArray();
                    }

                    //Zip Binary Data Array'in Standart MD5 Hash bilgisi hesaplanır.
                    HashGenerator hashGenerator = new HashGenerator();
                    string zipFileHash = hashGenerator.GetMD5Hash(zipFileBinaryDataArray);

                    IntegrationServiceRef.EArchiveManufacturedFile transferFile = new IntegrationServiceRef.EArchiveManufacturedFile()
                    {
                        FileNameWithExtension = Path.GetFileNameWithoutExtension(fileFullPath) + ".zip",    //Transfer edilecek dosya adı, dosya uzantısı .zip olmalıdır.
                        FileDataType = IntegrationServiceRef.TransferDocumentDataTypes.XML_INZIP,           //ZIP dosyası içerisindeki dosya formatı XML.
                        BinaryData = zipFileBinaryDataArray,                                                //ZIP dosyası Binary64 Data
                        BinaryDataHash = zipFileHash,                                                       //ZIP dosyası Binary64 Data MD5 Hash değeri

                        ReceiverMailTargetAddresses = new string[] { "ABC@XXX.COM", "XYZ@XXX.NET" },        //(Opsiyonel) Mail gönderilecek alıcı mail adresleri.
                    };

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferResult = serviceClient.TransferManufacturedReceiptFile(sessionCode, transferFile);
                }
                catch (TimeoutException timeProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferResult.OperationCompleted)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("!!! TRANSFER BAŞARILI !!!");

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine(Environment.NewLine + "TRANSFER DÖKÜMAN NUMARASI [ " + transferResult.TransferFileUniqueId + " ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! TRANSFER BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + transferResult.Description);
            }

            Console.ReadLine();
        }
        private static void TRANSFER_EARSIV_SERBEST_MESLEK_MAKBUZU_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferResult transferResult = null;

                try
                {
                    string fileFullPath = @"SELF_EMPLOYMENT_RECEIPT.xml";

                    //Gönderilecek dosya ZipBinaryArray'e dönüştürülür.
                    byte[] zipFileBinaryDataArray = null;
                    using (MemoryStream memoryStreamOutput = new MemoryStream())
                    {
                        using (ZipFile zip = new ZipFile())
                        {
                            zip.AddFile(fileFullPath, string.Empty);
                            zip.Save(memoryStreamOutput);
                        }
                        zipFileBinaryDataArray = memoryStreamOutput.ToArray();
                    }

                    //Zip Binary Data Array'in Standart MD5 Hash bilgisi hesaplanır.
                    HashGenerator hashGenerator = new HashGenerator();
                    string zipFileHash = hashGenerator.GetMD5Hash(zipFileBinaryDataArray);

                    IntegrationServiceRef.EArchiveSelfEmploymentFile transferFile = new IntegrationServiceRef.EArchiveSelfEmploymentFile()
                    {
                        FileNameWithExtension = Path.GetFileNameWithoutExtension(fileFullPath) + ".zip",    //Transfer edilecek dosya adı, dosya uzantısı .zip olmalıdır.
                        FileDataType = IntegrationServiceRef.TransferDocumentDataTypes.XML_INZIP,           //ZIP dosyası içerisindeki dosya formatı XML.
                        BinaryData = zipFileBinaryDataArray,                                                //ZIP dosyası Binary64 Data
                        BinaryDataHash = zipFileHash,                                                       //ZIP dosyası Binary64 Data MD5 Hash değeri

                        ReceiverMailTargetAddresses = new string[] { "ABC@XXX.COM", "XYZ@XXX.NET" },        //(Opsiyonel) Mail gönderilecek alıcı mail adresleri.

                        ReceiptTransportationType = IntegrationServiceRef.InvoiceTransportationTypes.ELEKTRONIK,
                    };

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferResult = serviceClient.TransferSelfEmploymentReceiptFile(sessionCode, transferFile);
                }
                catch (TimeoutException timeProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferResult.OperationCompleted)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("!!! TRANSFER BAŞARILI !!!");

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine(Environment.NewLine + "TRANSFER DÖKÜMAN NUMARASI [ " + transferResult.TransferFileUniqueId + " ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! TRANSFER BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + transferResult.Description);
            }

            Console.ReadLine();
        }
        private static void TRANSFER_EARSIV_ESKI_NESIL_OKC_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferResult transferResult = null;

                try
                {
                    string fileFullPath = @"M_RAPOR_DATA_3.xml";

                    //Gönderilecek dosya ZipBinaryArray'e dönüştürülür.
                    byte[] zipFileBinaryDataArray = null;
                    using (MemoryStream memoryStreamOutput = new MemoryStream())
                    {
                        using (ZipFile zip = new ZipFile())
                        {
                            zip.AddFile(fileFullPath, string.Empty);
                            zip.Save(memoryStreamOutput);
                        }
                        zipFileBinaryDataArray = memoryStreamOutput.ToArray();
                    }

                    //Zip Binary Data Array'in Standart MD5 Hash bilgisi hesaplanır.
                    HashGenerator hashGenerator = new HashGenerator();
                    string zipFileHash = hashGenerator.GetMD5Hash(zipFileBinaryDataArray);

                    IntegrationServiceRef.EArchiveOkcDocumentFile transferFile = new IntegrationServiceRef.EArchiveOkcDocumentFile()
                    {
                        FileNameWithExtension = Path.GetFileNameWithoutExtension(fileFullPath) + ".zip",    //Transfer edilecek dosya adı, dosya uzantısı .zip olmalıdır.
                        FileDataType = IntegrationServiceRef.TransferDocumentDataTypes.XML_INZIP,           //ZIP dosyası içerisindeki dosya formatı XML.
                        BinaryData = zipFileBinaryDataArray,                                                //ZIP dosyası Binary64 Data
                        BinaryDataHash = zipFileHash,                                                       //ZIP dosyası Binary64 Data MD5 Hash değeri
                    };

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferResult = serviceClient.TransferOkcOldDocumentFile(sessionCode, transferFile);
                }
                catch (TimeoutException timeProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferResult.OperationCompleted)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("!!! TRANSFER BAŞARILI !!!");

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine(Environment.NewLine + "TRANSFER DÖKÜMAN NUMARASI [ " + transferResult.TransferFileUniqueId + " ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! TRANSFER BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + transferResult.Description);
            }

            Console.ReadLine();
        }
        private static void TRANSFER_EARSIV_YENI_NESIL_OKC_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferResult transferResult = null;

                try
                {
                    string fileFullPath = @"YM_RAPOR_DATA_1.xml";

                    //Gönderilecek dosya ZipBinaryArray'e dönüştürülür.
                    byte[] zipFileBinaryDataArray = null;
                    using (MemoryStream memoryStreamOutput = new MemoryStream())
                    {
                        using (ZipFile zip = new ZipFile())
                        {
                            zip.AddFile(fileFullPath, string.Empty);
                            zip.Save(memoryStreamOutput);
                        }
                        zipFileBinaryDataArray = memoryStreamOutput.ToArray();
                    }

                    //Zip Binary Data Array'in Standart MD5 Hash bilgisi hesaplanır.
                    HashGenerator hashGenerator = new HashGenerator();
                    string zipFileHash = hashGenerator.GetMD5Hash(zipFileBinaryDataArray);

                    IntegrationServiceRef.EArchiveOkcDocumentFile transferFile = new IntegrationServiceRef.EArchiveOkcDocumentFile()
                    {
                        FileNameWithExtension = Path.GetFileNameWithoutExtension(fileFullPath) + ".zip",    //Transfer edilecek dosya adı, dosya uzantısı .zip olmalıdır.
                        FileDataType = IntegrationServiceRef.TransferDocumentDataTypes.XML_INZIP,           //ZIP dosyası içerisindeki dosya formatı XML.
                        BinaryData = zipFileBinaryDataArray,                                                //ZIP dosyası Binary64 Data
                        BinaryDataHash = zipFileHash,                                                       //ZIP dosyası Binary64 Data MD5 Hash değeri
                    };

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferResult = serviceClient.TransferOkcNewDocumentFile(sessionCode, transferFile);
                }
                catch (TimeoutException timeProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferResult.OperationCompleted)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("!!! TRANSFER BAŞARILI !!!");

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine(Environment.NewLine + "TRANSFER DÖKÜMAN NUMARASI [ " + transferResult.TransferFileUniqueId + " ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! TRANSFER BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + transferResult.Description);
            }

            Console.ReadLine();
        }
        private static void TRANSFER_SORGULAMA_TEST() // e-arsiv icin
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferQueryResult transferQueryResult = null;

                try
                {
                    string transferFileUniqueId = "4F79B74D-B0F9-4F5E-B702-A0DA21822F84"; //Guid.NewGuid().ToString().ToUpper();

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferQueryResult = serviceClient.GetTransferFileStatus(sessionCode, transferFileUniqueId);
                }
                catch (TimeoutException timeProblem)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferQueryResult.StateCode != -1)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("StateCode : {0}", transferQueryResult.StateCode);
                Console.WriteLine("StateName : {0}", transferQueryResult.StateName);
                Console.WriteLine("StateDescription : {0}", transferQueryResult.StateDescription);
            }

            Console.ReadLine();
        }
        private static void TRANSFER_OKC_DOCUMENT_SORGULAMA_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferQueryResult transferQueryResult = null;

                try
                {
                    string transferFileUniqueId = "CE598528-5FB6-4724-A7FD-1F6DA47D40AD"; //Guid.NewGuid().ToString().ToUpper();

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferQueryResult = serviceClient.GetTransferOkcInvoiceFileStatus(sessionCode, transferFileUniqueId);
                    //transferQueryResult = serviceClient.GetTransferOkcDocumentFileStatus(sessionCode, transferFileUniqueId);
                }
                catch (TimeoutException timeProblem)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferQueryResult.StateCode != -1)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("StateCode : {0}", transferQueryResult.StateCode);
                Console.WriteLine("StateName : {0}", transferQueryResult.StateName);
                Console.WriteLine("StateDescription : {0}", transferQueryResult.StateDescription);
            }

            Console.ReadLine();
        }
        private static void VKNTCKN_BAZINDA_TARIH_ARALIKLI_FATURA_ETTN_LISTESI()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                string[] salesInvoiceUUIDList = null;

                try
                {
                    string customerRegisterNumber = "1234567890";
                    DateTime dtStartIssueTime = new DateTime(2017, 08, 31);
                    DateTime dtEndIssueTime = new DateTime(2017, 12, 31);

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    salesInvoiceUUIDList = serviceClient.GetSalesInvoiceUUIDListWithCustomerRegisterNumber(sessionCode, customerRegisterNumber, dtStartIssueTime, dtEndIssueTime);
                }
                catch (TimeoutException timeProblem)
                {
                    Console.WriteLine(string.Format("TimeoutException: {0}", timeProblem.Message));
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    Console.WriteLine(string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription));
                }
                catch (CommunicationException commProblem)
                {
                    Console.WriteLine(string.Format("CommunicationException: {0}", commProblem.Message));
                }
                catch (Exception unknownEx)
                {
                    Console.WriteLine(string.Format("UnknownException: {0}", unknownEx.Message));
                }

                if (salesInvoiceUUIDList != null && salesInvoiceUUIDList.Length > 0)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! FATURA ETTN LISTESI !!!");
                    Console.ResetColor();
                    foreach (var item in salesInvoiceUUIDList)
                    {
                        Console.WriteLine("FATURA ETTN : {0}", item);
                    }
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! BU KRITERLERE UYGUN FATURA BULUNAMADI !!!");
                }
            }

            Console.ReadLine();
        }
        private static void FATURA_SORGULAMA_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.EArchiveInvoiceQueryResult invoiceQueryResult = null;

                try
                {
                    string invoiceNumber = "TST2019000000111";

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    invoiceQueryResult = serviceClient.GetSalesInvoiceStatusWithInvoiceNumber(sessionCode, invoiceNumber);
                }
                catch (TimeoutException timeProblem)
                {
                    invoiceQueryResult = new IntegrationServiceRef.EArchiveInvoiceQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    invoiceQueryResult = new IntegrationServiceRef.EArchiveInvoiceQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    invoiceQueryResult = new IntegrationServiceRef.EArchiveInvoiceQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    invoiceQueryResult = new IntegrationServiceRef.EArchiveInvoiceQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (invoiceQueryResult.StateCode != -1)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("StateCode : {0}", invoiceQueryResult.StateCode);
                Console.WriteLine("StateName : {0}", invoiceQueryResult.StateName);
                Console.WriteLine("StateDescription : {0}", invoiceQueryResult.StateDescription);
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("ReportStateCode : {0}", invoiceQueryResult.GIBReportStateCode);
                Console.WriteLine("ReportStateName : {0}", invoiceQueryResult.GIBReportStateName);
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("MailStateCode : {0}", invoiceQueryResult.MailStateCode);
                Console.WriteLine("MailStateName : {0}", invoiceQueryResult.MailStateName);
            }

            Console.ReadLine();
        }
        private static void ESKI_NESIL_OKC_SORGULAMA_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.EArchiveOkcDocumentQueryResult zreportQueryResult = null;

                try
                {
                    string OKCSerialNumber = "AS0000210149";
                    string ZRaporNo = "C2D60911-739D-4F56-98C0-7CDF0FE02C1F";

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    zreportQueryResult = serviceClient.GetOkcOldDocumentStatusWithZReportNo(sessionCode, OKCSerialNumber, ZRaporNo);
                }
                catch (TimeoutException timeProblem)
                {
                    zreportQueryResult = new IntegrationServiceRef.EArchiveOkcDocumentQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    zreportQueryResult = new IntegrationServiceRef.EArchiveOkcDocumentQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    zreportQueryResult = new IntegrationServiceRef.EArchiveOkcDocumentQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    zreportQueryResult = new IntegrationServiceRef.EArchiveOkcDocumentQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (zreportQueryResult.StateCode != -1)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("StateCode : {0}", zreportQueryResult.StateCode);
                Console.WriteLine("StateName : {0}", zreportQueryResult.StateName);
                Console.WriteLine("StateDescription : {0}", zreportQueryResult.StateDescription);
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("ReportStateCode : {0}", zreportQueryResult.GIBReportStateCode);
                Console.WriteLine("ReportStateName : {0}", zreportQueryResult.GIBReportStateName);
            }

            Console.ReadLine();
        }
        private static void FATURA_IPTAL_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.OperationResult cancelResult = null;

                try
                {
                    string invoiceNumber = "TST2017000000111";

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    cancelResult = serviceClient.CancelSalesInvoiceWithInvoiceNumber(sessionCode, DateTime.Now, invoiceNumber);
                }
                catch (TimeoutException timeProblem)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (cancelResult.OperationCompleted == true)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("Description : {0}", cancelResult.Description);
            }

            Console.ReadLine();
        }
        private static void MUSTAHSIL_MAKBUZU_IPTAL_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.OperationResult cancelResult = null;

                try
                {
                    string receiptNumber = "TST2018100000000";

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    cancelResult = serviceClient.CancelManufacturedReceiptWithReceiptNumber(sessionCode, DateTime.Now, receiptNumber);
                }
                catch (TimeoutException timeProblem)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    cancelResult = new IntegrationServiceRef.OperationResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (cancelResult.OperationCompleted == true)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("Description : {0}", cancelResult.Description);
            }

            Console.ReadLine();
        }
        private static void FATURA_DOWNLOAD_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.DownloadResult downloadResult = null;

                try
                {
                    string invoiceNumber = "TST2017000616161";

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    downloadResult = serviceClient.DownloadSalesInvoiceWithInvoiceNumber(sessionCode, IntegrationServiceRef.DownloadDocumentDataTypes.XML_INZIP, invoiceNumber);
                }
                catch (TimeoutException timeProblem)
                {
                    downloadResult = new IntegrationServiceRef.DownloadResult()
                    {
                        DownloadFileReady = false,
                        DownloadDescription = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    downloadResult = new IntegrationServiceRef.DownloadResult()
                    {
                        DownloadFileReady = false,
                        DownloadDescription = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    downloadResult = new IntegrationServiceRef.DownloadResult()
                    {
                        DownloadFileReady = false,
                        DownloadDescription = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    downloadResult = new IntegrationServiceRef.DownloadResult()
                    {
                        DownloadFileReady = false,
                        DownloadDescription = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (downloadResult.DownloadFileReady)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! INDIRME SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! INDIRME BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);

                if (downloadResult.DownloadFileReady)
                {
                    string fileName = downloadResult.DownloadFile.FileName + downloadResult.DownloadFile.FileExtension;
                    File.WriteAllBytes(@"C:\" + fileName, downloadResult.DownloadFile.FileData);

                    Console.WriteLine(fileName + " dosyası indirildi.");
                }
            }

            Console.ReadLine();
        }

        private static void TRANSFER_EARSIV_YENI_NESIL_ENTEGRASYON_KODU_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferResult transferResult = null;

                try
                {
                    string fileFullPath = @"c:\test.xls";
                    string uniqueIntegrationCode = "kendi unique id degeriniz"; // bu id ile örnek linke göndermelisiniz http://portal.veriban.com.tr/eArchive/Download/okcinvoice?referanceCode=05BC03A0-F968-4B15-BDFF-745904B6D26E&vkn=5890466688&amount=1.5

                    //Gönderilecek dosya ZipBinaryArray'e dönüştürülür.
                    byte[] zipFileBinaryDataArray = null;
                    using (MemoryStream memoryStreamOutput = new MemoryStream())
                    {
                        using (ZipFile zip = new ZipFile())
                        {
                            zip.AddFile(fileFullPath, string.Empty);
                            zip.Save(memoryStreamOutput);
                        }

                        zipFileBinaryDataArray = memoryStreamOutput.ToArray();
                    }

                    //Zip Binary Data Array'in Standart MD5 Hash bilgisi hesaplanır.
                    HashGenerator hashGenerator = new HashGenerator();
                    string zipFileHash = hashGenerator.GetMD5Hash(zipFileBinaryDataArray);

                    // EArchiveTransferFile normal e-arşiv yeni nesil okc
                    // EArchiveOkcDocumentFile documentfile - eski okc
                    IntegrationServiceRef.EArchiveTransferFile transferFile = new IntegrationServiceRef.EArchiveTransferFile()
                    {
                        FileNameWithExtension = Path.GetFileNameWithoutExtension(fileFullPath) + ".zip",//Transfer edilecek dosya adı, dosya uzantısı .zip olmalıdır.
                        FileDataType = IntegrationServiceRef.TransferDocumentDataTypes.XML_INZIP,   //ZIP dosyası içerisindeki dosya formatı XML.
                        BinaryData = zipFileBinaryDataArray,//ZIP dosyası Binary64 Data
                        BinaryDataHash = zipFileHash,   //ZIP dosyası Binary64 Data MD5 Hash değeri
                        InvoiceTransportationType = IntegrationServiceRef.InvoiceTransportationTypes.KAGIT, // fatura türü
                        IsInternetSalesInvoice = false // internet değilse
                    };

                    //sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferResult = serviceClient.TransferOkcInvoiceFileWithIntegrationCode(sessionCode, transferFile, uniqueIntegrationCode);
                }
                catch (TimeoutException timeProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferResult = new IntegrationServiceRef.TransferResult()
                    {
                        OperationCompleted = false,
                        Description = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferResult.OperationCompleted)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("!!! TRANSFER BAŞARILI !!!");

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine(Environment.NewLine + "TRANSFER DÖKÜMAN NUMARASI [ " + transferResult.TransferFileUniqueId + " ]");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! TRANSFER BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + transferResult.Description);
            }

            Console.ReadLine();
        }

        private static void MUSTAHSIL_TRANSFER_SORGULAMA_TEST()
        {
            using (IntegrationServiceRef.IntegrationServiceClient serviceClient = new IntegrationServiceRef.IntegrationServiceClient())
            {
                IntegrationServiceRef.TransferQueryResult transferQueryResult = null;

                try
                { //95abb182-632f-4a4a-86bd-704346982ce0
                    string transferFileUniqueId = "9555BA43-8CCB-4A2A-A0CC-803A3DC638B6"; //Guid.NewGuid().ToString().ToUpper();

                    sessionCode = serviceClient.Login(TestUserName, TestPassword);

                    transferQueryResult = serviceClient.GetTransferManufacturedFileStatus(sessionCode, transferFileUniqueId); // kuyruk sorgulama
                }
                catch (TimeoutException timeProblem)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("TimeoutException: {0}", timeProblem.Message)
                    };
                }
                catch (FaultException<IntegrationServiceRef.VeribanServiceFault> veribanFault)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("Code:[{0}], Message: {1}", veribanFault.Detail.FaultCode, veribanFault.Detail.FaultDescription)
                    };
                }
                catch (CommunicationException commProblem)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("CommunicationException: {0}", commProblem.Message)
                    };
                }
                catch (Exception unknownEx)
                {
                    transferQueryResult = new IntegrationServiceRef.TransferQueryResult()
                    {
                        StateCode = -1,
                        StateName = string.Empty,
                        StateDescription = string.Format("UnknownException: {0}", unknownEx.Message)
                    };
                }

                if (transferQueryResult.StateCode != -1)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("!!! SORGULAMA SONUCU !!!");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("!!! SORGULAMA BAŞARISIZ !!!");
                }

                Console.ResetColor();
                Console.WriteLine(Environment.NewLine + "========================" + Environment.NewLine);
                Console.WriteLine("StateCode : {0}", transferQueryResult.StateCode);
                Console.WriteLine("StateName : {0}", transferQueryResult.StateName);
                Console.WriteLine("StateDescription : {0}", transferQueryResult.StateDescription);
            }

            Console.ReadLine();
        }
    }
}
